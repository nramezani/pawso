import asyncio
import unittest

from fastapi import HTTPException

from rate_limit import UsageLimiter
from upload_validation import content_type_matches, detect_supported_file


class UploadValidationTests(unittest.TestCase):
    def test_detects_supported_signatures(self):
        samples = {
            b"%PDF-1.7\n": "application/pdf",
            b"\xff\xd8\xff\xe0rest": "image/jpeg",
            b"\x89PNG\r\n\x1a\nrest": "image/png",
            b"RIFF1234WEBPrest": "image/webp",
        }
        for data, expected_type in samples.items():
            with self.subTest(expected_type=expected_type):
                detected = detect_supported_file(data)
                self.assertIsNotNone(detected)
                self.assertEqual(detected.content_type, expected_type)

    def test_rejects_spoofed_or_unsupported_content(self):
        self.assertIsNone(detect_supported_file(b"not really a PDF"))
        detected = detect_supported_file(b"%PDF-1.7\n")
        self.assertFalse(content_type_matches("image/jpeg", detected))


class UsageLimiterTests(unittest.IsolatedAsyncioTestCase):
    async def test_minute_limit_is_per_user(self):
        limiter = UsageLimiter(requests_per_minute=2, requests_per_day=10)
        await limiter.check("user-a")
        await limiter.check("user-a")
        await limiter.check("user-b")

        with self.assertRaises(HTTPException) as context:
            await limiter.check("user-a")
        self.assertEqual(context.exception.status_code, 429)

    async def test_daily_limit_is_enforced(self):
        limiter = UsageLimiter(requests_per_minute=10, requests_per_day=1)
        await limiter.check("user-a")
        with self.assertRaises(HTTPException) as context:
            await limiter.check("user-a")
        self.assertEqual(context.exception.status_code, 429)


if __name__ == "__main__":
    unittest.main()
