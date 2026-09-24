import unittest

from pydantic import ValidationError

from production_router import InvitationEmailRequest


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


if __name__ == "__main__":
    unittest.main()
