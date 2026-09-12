from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse


app = FastAPI(
    title="Pawso API",
    version="0.2.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "pawso-api",
    }


@app.post("/api/v1/documents/extract")
async def extract_document(
    file: UploadFile = File(...)
):
    file_bytes = await file.read()

    if not file_bytes:
        return JSONResponse(
            status_code=400,
            content={
                "status": "error",
                "message": "Uploaded file is empty.",
            },
        )

    return {
        "status": "success",
        "document": {
            "filename": file.filename,
            "content_type": file.content_type,
            "size_bytes": len(file_bytes),
        },
        "extraction": {
            "visit_date": "August 15, 2026",
            "clinic": "Veterinary Clinic",
            "finding": "One kidney appears smaller than expected.",
            "diagnosis": (
                "Possible chronic kidney disease; "
                "further investigation recommended."
            ),
            "follow_up": (
                "Kidney ultrasound and repeat urine testing."
            ),
        },
        "message": (
            "File received successfully. "
            "AI extraction is mocked for now."
        ),
    }