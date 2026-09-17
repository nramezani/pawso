from dataclasses import dataclass


@dataclass(frozen=True)
class DetectedFile:
    content_type: str
    extension: str


def detect_supported_file(data: bytes) -> DetectedFile | None:
    if data.startswith(b"%PDF-"):
        return DetectedFile("application/pdf", "pdf")
    if data.startswith(b"\xff\xd8\xff"):
        return DetectedFile("image/jpeg", "jpg")
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return DetectedFile("image/png", "png")
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return DetectedFile("image/webp", "webp")
    return None


def content_type_matches(reported: str | None, detected: DetectedFile) -> bool:
    normalized = (reported or "").lower().split(";", 1)[0].strip()
    aliases = {
        "image/jpg": "image/jpeg",
        "image/pjpeg": "image/jpeg",
    }
    normalized = aliases.get(normalized, normalized)
    return normalized == detected.content_type
