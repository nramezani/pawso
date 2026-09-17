import base64
import os
from typing import Literal

from ask_router import router as ask_router
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from openai import OpenAI
from pydantic import BaseModel
from rate_limit import enforce_ai_limits
from upload_validation import content_type_matches, detect_supported_file


load_dotenv()

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

app = FastAPI(
    title="Pawso API",
    version="0.3.0",
)
app.include_router(ask_router)

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
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


MAX_FILE_SIZE = max(1, int(os.getenv("MAX_UPLOAD_SIZE_MB", "10"))) * 1024 * 1024


class VetRecordExtraction(BaseModel):
    visit_date: str | None
    clinic: str | None
    finding: str | None
    diagnosis: str | None
    diagnosis_certainty: Literal[
        "confirmed",
        "suspected",
        "possible",
        "rule_out",
        "historical",
        "unknown",
    ]
    follow_up: str | None
    medications: list[str]
    warnings: list[str]


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "pawso-api",
    }


@app.post("/api/v1/documents/extract")
async def extract_document(
    file: UploadFile = File(...),
    _user=Depends(enforce_ai_limits),
):
    try:
        file_bytes = await file.read()

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

        if content_type == "application/pdf":
            document_part = {
                "type": "input_file",
                "filename": file.filename or "vet-record.pdf",
                "file_data": (
                    "data:application/pdf;base64,"
                    + encoded
                ),
                "detail": "high",
            }

        else:
            document_part = {
                "type": "input_image",
                "image_url": (
                    f"data:{content_type};base64,"
                    f"{encoded}"
                ),
                "detail": "high",
            }

        response = client.responses.parse(
            model="gpt-5.6-luna",
            input=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": user_text,
                        },
                        document_part,
                    ],
                },
            ],
            text_format=VetRecordExtraction,
        )

        extraction = response.output_parsed

        if extraction is None:
            raise RuntimeError(
                "The AI did not return structured extraction data."
            )

        return {
            "status": "success",
            "document": {
                "filename": file.filename,
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
        print(
            "AI extraction error:",
            repr(exc),
        )

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
