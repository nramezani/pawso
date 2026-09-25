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

    def test_care_completion_is_rpc_only_and_functions_are_not_public(self):
        hardening = (
            MIGRATIONS / "20260928_harden_rpc_access_and_care_history.sql"
        ).read_text(encoding="utf-8").lower()

        self.assertIn(
            "revoke insert on table public.task_completions from authenticated",
            hardening,
        )
        self.assertIn(
            "create unique index if not exists task_completions_one_per_task_idx",
            hardening,
        )
        self.assertIn("from public, anon", hardening)
        self.assertIn("to authenticated", hardening)
        self.assertIn("function public.create_medication_with_schedules", hardening)
        self.assertIn("function public.record_weight_check_in", hardening)
        self.assertIn("insert into public.medication_schedules", hardening)
        self.assertIn("update public.pets", hardening)

    def test_complete_product_migration_covers_data_rights_and_workflows(self):
        migration = (
            MIGRATIONS / "20260929_complete_product_foundation.sql"
        ).read_text(encoding="utf-8").lower()

        for required_fragment in (
            "add column if not exists time_zone",
            "add column if not exists archived_at",
            "add column if not exists snoozed_until",
            "add column if not exists scheduled_due_at",
            "function public.correct_medication_log",
            "function public.save_medication_with_schedules",
            "function public.record_medication_dose",
            "function public.create_care_task_with_recurrence",
            "function public.resolve_care_task",
            "function public.create_household_invitation",
            "function public.accept_household_invitation",
            "function public.record_structured_symptom",
            "function public.record_lab_result_entry",
            "function public.record_weight_check_in",
            "function public.consume_api_rate_limit",
            "function public.confirm_vet_extraction",
            "insert into storage.buckets",
            "documents_metadata_length_check",
            "pets_profile_length_check",
        ):
            self.assertIn(required_fragment, migration)

        self.assertIn("revoke all on public.api_rate_limits", migration)
        self.assertIn("from public, anon", migration)
        self.assertIn("to authenticated", migration)
        self.assertIn("bucket_id = 'pet-photos'", migration)
        self.assertIn("(storage.foldername(name))[1] = auth.uid()::text", migration)
        self.assertIn("coalesce(task_row.scheduled_due_at, task_row.due_at)", migration)
        self.assertIn("log_row.user_id is distinct from auth.uid()", migration)
        self.assertIn("archived medications cannot be edited", migration)
        self.assertIn("dose time does not match the medication schedule", migration)
        self.assertIn("a dose can only be logged for the current household day", migration)
        self.assertIn("for update of schedule", migration)
        self.assertIn("existing_log.schedule_id = target_schedule", migration)
        self.assertIn("auth.jwt() ->> 'is_anonymous'", migration)
        self.assertIn("secure your pawso account before sending invitations", migration)
        self.assertIn("symptom date cannot be in the future", migration)
        self.assertIn("lab date cannot be in the future", migration)
        self.assertIn("laboratory value is outside pawso''s supported range", migration)
        self.assertIn("weight date cannot be in the future", migration)
        self.assertIn(
            "foreign key (accepted_by) references auth.users(id) on delete set null",
            migration,
        )
        self.assertIn("on conflict (extraction_id, field_type)", migration)
        self.assertIn("visit date cannot be in the future", migration)
        self.assertIn("jsonb_array_length(medications_payload) > 30", migration)
        self.assertIn("revoke execute on function public.confirm_vet_extraction", migration)
        self.assertIn(
            "revoke insert, update, delete on public.medication_logs from authenticated",
            migration,
        )

    def test_structured_health_writes_are_rpc_only(self):
        migration = (
            MIGRATIONS / "20260929_complete_product_foundation.sql"
        ).read_text(encoding="utf-8").lower()

        self.assertIn(
            "revoke insert, update, delete on public.symptom_entries from authenticated",
            migration,
        )
        self.assertIn(
            "revoke insert, update, delete on public.lab_results from authenticated",
            migration,
        )
        self.assertIn(
            "grant execute on function public.record_structured_symptom",
            migration,
        )
        self.assertIn(
            "grant execute on function public.record_lab_result_entry",
            migration,
        )


if __name__ == "__main__":
    unittest.main()
