import re
import unittest
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = REPO_ROOT / "supabase" / "migrations"


class MigrationContractTests(unittest.TestCase):
    def test_invitation_cancellation_uses_an_allowed_status(self):
        household_schema = (
            MIGRATIONS / "20260912_household_shared_care.sql"
        ).read_text(encoding="utf-8")
        access_management = (
            MIGRATIONS / "20260924_household_access_management.sql"
        ).read_text(encoding="utf-8")

        allowed_match = re.search(
            r"status in \(([^)]+)\)",
            household_schema,
            flags=re.IGNORECASE,
        )
        self.assertIsNotNone(allowed_match)
        self.assertIn("'revoked'", allowed_match.group(1))
        self.assertIn("set status = 'revoked'", access_management.lower())
        self.assertNotIn("set status = 'cancelled'", access_management.lower())

    def test_forward_repair_binds_addressed_invites_to_email(self):
        repair = (
            MIGRATIONS / "20260925_fix_household_invitation_cancellation.sql"
        ).read_text(encoding="utf-8")

        self.assertIn("invitation.invited_email is not null", repair)
        self.assertIn("auth.jwt() ->> 'email'", repair)

    def test_multi_step_writes_have_transactional_rpcs(self):
        care_completion = (
            MIGRATIONS / "20260926_atomic_care_completion.sql"
        ).read_text(encoding="utf-8")
        extraction_confirmation = (
            MIGRATIONS / "20260927_atomic_extraction_confirmation.sql"
        ).read_text(encoding="utf-8")

        self.assertIn("function public.complete_care_task", care_completion)
        self.assertIn("insert into public.task_completions", care_completion)
        self.assertIn("update public.care_tasks", care_completion)
        self.assertIn(
            "function public.confirm_vet_extraction",
            extraction_confirmation,
        )
        self.assertIn("insert into public.medical_events", extraction_confirmation)
        self.assertIn("update public.ai_extractions", extraction_confirmation)


if __name__ == "__main__":
    unittest.main()
