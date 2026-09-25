import base64
import logging
import os
import re
import time
from typing import Annotated, Literal
from uuid import uuid4

from ai_client import MAX_OUTPUT_TOKENS, MODEL, call_structured, get_client
from ask_router import router as ask_router
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from rate_limit import enforce_ai_limits
from production_router import router as production_router
from upload_validation import content_type_matches, detect_supported_file


load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("pawso.api")

# Disable the auto-generated OpenAPI docs/schema in production so the full
# API surface (request/response models, endpoint list) isn't publicly
# browsable at /docs, /redoc, /openapi.json. Set ENVIRONMENT=production in
# the deployment platform's env vars; anything else (including unset, for
# local dev) keeps docs enabled.
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development").lower() == "production"

app = FastAPI(
    title="Pawso API",
    version="0.3.0",
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)
app.include_router(ask_router)
app.include_router(production_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in os.getenv(
            "CORS_ALLOWED_ORIGINS",
            "http://localhost:8081,http://localhost:19006",
        ).split(",")
        if origin.strip()
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


def safe_request_id(value: str | None) -> str:
    """Accept only compact log-safe request IDs; generate one otherwise."""

    supplied = value or ""
    return supplied if re.fullmatch(r"[A-Za-z0-9._:-]{1,80}", supplied) else str(uuid4())


@app.middleware("http")
async def privacy_safe_request_metrics(request: Request, call_next):
    """Log route-level latency without bodies, tokens, email, or query text."""

    request_id = safe_request_id(request.headers.get("x-request-id"))
    started = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        response.headers["X-Request-ID"] = request_id
        return response
    except Exception as exc:
        logger.error(
            "request_failed request_id=%s method=%s path=%s error_type=%s",
            request_id,
            request.method,
            request.url.path,
            type(exc).__name__,
        )
        raise
    finally:
        duration_ms = round((time.perf_counter() - started) * 1000, 1)
        logger.info(
            "request_complete request_id=%s method=%s path=%s status=%s duration_ms=%s",
            request_id,
            request.method,
            request.url.path,
            status_code,
            duration_ms,
        )


MAX_FILE_SIZE = max(1, int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))) * 1024 * 1024
EXTRACTION_PROMPT_VERSION = "vet-record-extraction-v1"


class VetRecordExtraction(BaseModel):
    visit_date: Annotated[str, Field(max_length=100)] | None
    clinic: Annotated[str, Field(max_length=200)] | None
    finding: Annotated[str, Field(max_length=4000)] | None
    diagnosis: Annotated[str, Field(max_length=4000)] | None
    diagnosis_certainty: Literal[
        "confirmed",
        "suspected",
        "possible",
        "rule_out",
        "historical",
        "unknown",
    ]
    follow_up: Annotated[str, Field(max_length=4000)] | None
    medications: list[Annotated[str, Field(max_length=500)]] = Field(max_length=30)
    warnings: list[Annotated[str, Field(max_length=500)]] = Field(max_length=30)


@app.get("/")
def service_home():
    return {
        "status": "ok",
        "service": "pawso-api",
        "health": "/health",
        "readiness": "/ready",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "pawso-api",
    }


@app.get("/ready")
def readiness_check():
    required = [
        "OPENAI_API_KEY",
        "SUPABASE_URL",
        "SUPABASE_PUBLISHABLE_KEY",
    ]
    if IS_PRODUCTION:
        required.extend(
            [
                "SUPABASE_SERVICE_ROLE_KEY",
                "RESEND_API_KEY",
                "PAWSO_INVITE_FROM_EMAIL",
                "PAWSO_INVITE_BASE_URL",
                "PAWSO_IOS_DOWNLOAD_URL",
                "PAWSO_ANDROID_DOWNLOAD_URL",
            ]
        )
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "service": "pawso-api",
                "missing_configuration": missing,
            },
        )
    return {
        "status": "ready",
        "service": "pawso-api",
        "model": MODEL,
    }


@app.post("/api/v1/documents/extract")
async def extract_document(
    file: UploadFile = File(...),
    _user=Depends(enforce_ai_limits),
):
    try:
        filename = file.filename or "vet-record"
        if len(filename) > 255:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "The file name must be 255 characters or fewer.",
                },
            )

        # Copy at most one byte beyond the cap into process memory so a large
        # attacker-controlled upload cannot trigger an unbounded read.
        file_bytes = await file.read(MAX_FILE_SIZE + 1)

        if not file_bytes:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "Uploaded file is empty.",
                },
            )

        if len(file_bytes) > MAX_FILE_SIZE:
            return JSONResponse(
                status_code=413,
                content={
                    "status": "error",
                    "message": (
                        f"File is too large. Maximum size is "
                        f"{MAX_FILE_SIZE // (1024 * 1024)} MB."
                    ),
                },
            )

        detected_file = detect_supported_file(file_bytes)
        if detected_file is None:
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": (
                        "Only genuine PDF, JPEG, PNG, and WebP files are supported."
                    ),
                },
            )

        if not content_type_matches(file.content_type, detected_file):
            return JSONResponse(
                status_code=400,
                content={
                    "status": "error",
                    "message": "The file contents do not match its reported type.",
                },
            )

        content_type = detected_file.content_type

        encoded = base64.b64encode(
            file_bytes
        ).decode("utf-8")

        system_prompt = """
You are Pawso's veterinary record extraction engine.

Your job is to extract information exactly from the uploaded
veterinary document.

Important rules:

1. Do not diagnose.
2. Do not invent missing information.
3. If a value is not present, return null.
4. Preserve uncertainty exactly.
5. Do not convert "possible", "suspected", "rule out", or similar
   wording into a confirmed diagnosis.
6. Do not recommend treatment.
7. Do not change medication doses, frequencies, or durations.
8. Follow-up should only contain follow-up instructions actually
   present in the document.
9. Findings should describe objective findings or observations.
10. Diagnosis should describe the veterinarian's assessment,
    impression, or diagnosis only if present.
11. medications should contain medication instructions found in
    the document, keeping dose/frequency wording as close to the
    source as practical.
12. warnings should identify ambiguity, poor scan quality,
    unclear medication instructions, missing dates, or other
    extraction concerns.

This information will be reviewed by the pet owner before anything
is saved to the medical record.
"""

        user_text = """
Extract the veterinary record into the required structured format.

Pay special attention to:
- visit date
- veterinary clinic
- findings
- veterinarian assessment or diagnosis
- uncertainty wording
- follow-up instructions
- medications
- anything that needs owner verification

Never fill in information that is not actually present.
"""

        # "auto" lets the model choose low/high detail based on the image;
        # "high" (the previous hardcoded value) is the most expensive vision
        # tier and was being forced on every extraction regardless of
        # whether the document actually needed that fidelity. Override via
        # OPENAI_IMAGE_DETAIL if a specific document type is shown to need
        # forced high-detail OCR.
        image_detail = os.getenv("OPENAI_IMAGE_DETAIL", "auto")

        if content_type == "application/pdf":
            document_part = {
                "type": "input_file",
                "filename": filename,
                "file_data": (
                    "data:application/pdf;base64,"
                    + encoded
                ),
                "detail": image_detail,
            }

        else:
            document_part = {
                "type": "input_image",
                "image_url": (
                    f"data:{content_type};base64,"
                    f"{encoded}"
                ),
                "detail": image_detail,
            }

        try:
            client = get_client()
        except RuntimeError:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "error",
                    "message": "Pawso AI is temporarily unavailable.",
                },
            )

        extraction = call_structured(
            client,
            system_prompt=system_prompt,
            user_content=[
                {
                    "type": "input_text",
                    "text": user_text,
                },
                document_part,
            ],
            response_model=VetRecordExtraction,
        )

        if extraction is None:
            raise RuntimeError(
                "The AI did not return structured extraction data."
            )

        return {
            "status": "success",
            "ai": {
                "model": MODEL,
                "prompt_version": EXTRACTION_PROMPT_VERSION,
            },
            "document": {
                "filename": filename,
                "content_type": content_type,
                "size_bytes": len(file_bytes),
            },
            "extraction": {
                "visit_date": extraction.visit_date,
                "clinic": extraction.clinic,
                "finding": extraction.finding,
                "diagnosis": extraction.diagnosis,
                "diagnosis_certainty": (
                    extraction.diagnosis_certainty
                ),
                "follow_up": extraction.follow_up,
                "medications": extraction.medications,
                "warnings": extraction.warnings,
            },
            "message": (
                "Veterinary record analyzed successfully. "
                "Owner confirmation is required before saving."
            ),
        }

    except Exception as exc:
        logger.error("ai_extraction_failed error_type=%s", type(exc).__name__)

        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": (
                    "Pawso could not analyze this veterinary "
                    "record."
                ),
            },
        )
