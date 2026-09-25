import unittest
from pathlib import Path

from pydantic import ValidationError

from production_router import ClientEventRequest, InvitationEmailRequest


class InvitationEmailRequestTests(unittest.TestCase):
    def test_normalizes_valid_email(self):
        request = InvitationEmailRequest(
            household_id="11111111-1111-1111-1111-111111111111",
            email="  Sitter@Example.COM ",
            role="sitter",
            invite_code="22222222-2222-2222-2222-222222222222",
        )

        self.assertEqual(request.email, "sitter@example.com")

    def test_rejects_malformed_email(self):
        with self.assertRaises(ValidationError):
            InvitationEmailRequest(
                household_id="11111111-1111-1111-1111-111111111111",
                email="not-an-email",
                role="caregiver",
                invite_code="22222222-2222-2222-2222-222222222222",
            )

    def test_rejects_malformed_identifiers(self):
        with self.assertRaises(ValidationError):
            InvitationEmailRequest(
                household_id="not-a-uuid",
                email="sitter@example.com",
                role="sitter",
                invite_code="also-not-a-uuid",
            )


class StorageDeletionTests(unittest.TestCase):
    def test_document_deletion_uses_all_discovered_storage_objects(self):
        source = (Path(__file__).resolve().parents[1] / "production_router.py").read_text(
            encoding="utf-8"
        )
        document_handler = source.split(
            '@router.delete("/documents/{document_id}"', 1
        )[1].split('@router.delete("/pets/{pet_id}"', 1)[0]

        self.assertIn('"select": "id,pet_id,user_id,storage_path,filename"', document_handler)
        self.assertIn("document_objects.extend", document_handler)
        self.assertIn("document_objects,", document_handler)


class ClientEventRequestTests(unittest.TestCase):
    def test_accepts_only_low_detail_diagnostics(self):
        event = ClientEventRequest(
            kind="crash",
            fingerprint="12abcdef",
            platform="ios",
            app_version="1.0.0",
        )
        self.assertEqual(event.fingerprint, "12abcdef")

    def test_rejects_messages_or_stack_traces(self):
        with self.assertRaises(ValidationError):
            ClientEventRequest(
                kind="crash",
                fingerprint="12abcdef",
                platform="android",
                app_version="1.0.0",
                message="Pet or account data must never be accepted here",
            )


if __name__ == "__main__":
    unittest.main()
