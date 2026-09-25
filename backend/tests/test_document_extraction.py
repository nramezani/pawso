import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

import main


class DocumentExtractionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        main.app.dependency_overrides[main.enforce_ai_limits] = lambda: object()
        cls.client = TestClient(main.app)

    @classmethod
    def tearDownClass(cls):
        main.app.dependency_overrides.clear()

    def test_service_home_is_not_a_404(self):
        response = self.client.get("/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["service"], "pawso-api")

    def test_response_identifies_model_and_prompt_version(self):
        extraction = main.VetRecordExtraction(
            visit_date="2026-09-20",
            clinic="Pawso Vet",
            finding="Normal exam",
            diagnosis="Healthy",
            diagnosis_certainty="confirmed",
            follow_up=None,
            medications=[],
            warnings=[],
        )

        with (
            patch.object(main, "get_client", return_value=object()),
            patch.object(main, "call_structured", return_value=extraction),
        ):
            response = self.client.post(
                "/api/v1/documents/extract",
                files={
                    "file": (
                        "visit.pdf",
                        b"%PDF-1.4\nPawso test record",
                        "application/pdf",
                    )
                },
            )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["ai"]["model"], main.MODEL)
        self.assertEqual(
            payload["ai"]["prompt_version"],
            main.EXTRACTION_PROMPT_VERSION,
        )
        self.assertEqual(
            payload["extraction"]["diagnosis_certainty"],
            "confirmed",
        )

    def test_rejects_a_file_whose_bytes_do_not_match_the_type(self):
        response = self.client.post(
            "/api/v1/documents/extract",
            files={"file": ("fake.pdf", b"not a pdf", "application/pdf")},
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("genuine PDF", response.json()["message"])

    def test_upload_read_is_bounded_by_configured_limit(self):
        with patch.object(main, "MAX_FILE_SIZE", 16):
            response = self.client.post(
                "/api/v1/documents/extract",
                files={"file": ("large.pdf", b"%PDF-1.4\n" + b"x" * 32, "application/pdf")},
            )
        self.assertEqual(response.status_code, 413)

    def test_rejects_oversized_filename(self):
        response = self.client.post(
            "/api/v1/documents/extract",
            files={"file": ("a" * 252 + ".pdf", b"%PDF-1.4\ntest", "application/pdf")},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("file name", response.json()["message"].lower())

    def test_missing_ai_configuration_is_sanitized(self):
        with patch.object(main, "get_client", side_effect=RuntimeError("secret setup detail")):
            response = self.client.post(
                "/api/v1/documents/extract",
                files={"file": ("visit.pdf", b"%PDF-1.4\ntest", "application/pdf")},
            )
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("secret setup detail", response.text)


if __name__ == "__main__":
    unittest.main()
