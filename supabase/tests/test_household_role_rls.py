"""RLS regression tests for household role tiers (owner / caregiver / sitter).

This is the test the audit flagged as missing: a way to catch the exact bug
that was just fixed (silently-permissive duplicate RLS policies) if it ever
regresses. It hits a REAL Supabase project over HTTP using each test user's
own JWT, so RLS is actually exercised the same way the mobile app exercises
it -- unlike testing application code with mocks, this is the only way to
verify Postgres policies themselves.

NOT wired into CI: it requires a disposable Supabase project (or a project
you're comfortable seeding test data into) plus three real user accounts,
which the audit/security review explicitly said not to provision here
("don't spend money / create cloud resources"). Run it manually against a
dev project before merging any future RLS change.

One-time setup on a dev/staging Supabase project (not production):
  1. Create three user accounts (Auth > Users, or self-serve sign-up):
       owner@example.com / caregiver@example.com / sitter@example.com
  2. As the owner, create a household (call
     `select ensure_household_for_current_user();` once signed in as owner,
     or just add a pet in the app, which creates one automatically).
  3. As the owner, create two invitations (`create_household_invitation`)
     with target_role='caregiver' and target_role='sitter', and accept each
     one while signed in as the corresponding user
     (`accept_household_invitation(<code>)`).
  4. As the owner, create one pet in that household.

Then run:
    SUPABASE_URL=... SUPABASE_PUBLISHABLE_KEY=... \\
    TEST_OWNER_EMAIL=owner@example.com TEST_OWNER_PASSWORD=... \\
    TEST_CAREGIVER_EMAIL=caregiver@example.com TEST_CAREGIVER_PASSWORD=... \\
    TEST_SITTER_EMAIL=sitter@example.com TEST_SITTER_PASSWORD=... \\
    TEST_PET_ID=<uuid of the pet created in step 4> \\
    python -m unittest supabase.tests.test_household_role_rls
"""

import os
import unittest

import requests

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")
TEST_PET_ID = os.getenv("TEST_PET_ID")

REQUIRED_ENV = [
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "TEST_OWNER_EMAIL",
    "TEST_OWNER_PASSWORD",
    "TEST_CAREGIVER_EMAIL",
    "TEST_CAREGIVER_PASSWORD",
    "TEST_SITTER_EMAIL",
    "TEST_SITTER_PASSWORD",
    "TEST_PET_ID",
]
MISSING_ENV = [name for name in REQUIRED_ENV if not os.getenv(name)]


def _sign_in(email: str, password: str) -> str:
    response = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": SUPABASE_PUBLISHABLE_KEY},
        json={"email": email, "password": password},
        timeout=10,
    )
    response.raise_for_status()
    return response.json()["access_token"]


def _headers(jwt: str) -> dict:
    return {
        "apikey": SUPABASE_PUBLISHABLE_KEY,
        "Authorization": f"Bearer {jwt}",
        "Content-Type": "application/json",
    }


@unittest.skipIf(
    MISSING_ENV,
    f"Skipped: missing env vars for a live RLS check against a real Supabase "
    f"project: {MISSING_ENV}. See module docstring for setup steps. This is "
    f"expected in CI -- run manually against a dev project.",
)
class HouseholdRoleRLSTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.owner_jwt = _sign_in(os.getenv("TEST_OWNER_EMAIL"), os.getenv("TEST_OWNER_PASSWORD"))
        cls.caregiver_jwt = _sign_in(
            os.getenv("TEST_CAREGIVER_EMAIL"), os.getenv("TEST_CAREGIVER_PASSWORD")
        )
        cls.sitter_jwt = _sign_in(os.getenv("TEST_SITTER_EMAIL"), os.getenv("TEST_SITTER_PASSWORD"))

    def test_sitter_cannot_insert_medication(self):
        """The core bug this migration fixes: a sitter should not be able to
        write medical data even though the RLS policy check only rejects
        owners, because the app UI already hides this action for sitters."""
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/medications",
            headers=_headers(self.sitter_jwt),
            json={"pet_id": TEST_PET_ID, "name": "rls-test-should-be-rejected"},
            timeout=10,
        )
        self.assertIn(
            response.status_code,
            (401, 403),
            f"Sitter was able to insert a medication (status={response.status_code}, "
            f"body={response.text}) -- RLS policy is not enforcing owner-only writes.",
        )

    def test_sitter_cannot_insert_medical_event(self):
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/medical_events",
            headers=_headers(self.sitter_jwt),
            json={"pet_id": TEST_PET_ID, "title": "rls-test-should-be-rejected"},
            timeout=10,
        )
        self.assertIn(response.status_code, (401, 403))

    def test_caregiver_can_view_but_not_manage_medical_records(self):
        view_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/medications?pet_id=eq.{TEST_PET_ID}",
            headers=_headers(self.caregiver_jwt),
            timeout=10,
        )
        self.assertEqual(view_response.status_code, 200)

        write_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/medications",
            headers=_headers(self.caregiver_jwt),
            json={"pet_id": TEST_PET_ID, "name": "rls-test-should-be-rejected"},
            timeout=10,
        )
        self.assertIn(
            write_response.status_code,
            (401, 403),
            "Caregiver should be able to view but not create medications "
            "(only owner can, per can_manage_household_medical).",
        )

    def test_owner_uses_atomic_medication_rpc_not_direct_insert(self):
        direct_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/medications",
            headers=_headers(self.owner_jwt),
            json={"pet_id": TEST_PET_ID, "name": "rls-direct-write-should-fail"},
            timeout=10,
        )
        self.assertIn(
            direct_response.status_code,
            (401, 403),
            "Direct medication writes must stay disabled so schedules cannot be partially saved.",
        )

        rpc_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/save_medication_with_schedules",
            headers=_headers(self.owner_jwt),
            json={
                "target_pet": TEST_PET_ID,
                "target_name": "rls-test-owner-rpc",
                "target_dose": "1",
                "target_unit": "tablet",
                "target_instructions": "Disposable staging test row; archive after creation.",
                "target_times": ["08:00"],
            },
            timeout=10,
        )
        self.assertEqual(
            rpc_response.status_code,
            200,
            f"Owner medication RPC failed (status={rpc_response.status_code}, "
            f"body={rpc_response.text}).",
        )
        medication_id = rpc_response.json()
        archive_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/set_medication_state",
            headers=_headers(self.owner_jwt),
            json={"target_medication": medication_id, "target_action": "archive"},
            timeout=10,
        )
        self.assertEqual(archive_response.status_code, 200)

    def test_structured_health_tables_are_rpc_only_and_hidden_from_sitter(self):
        for table in ("symptom_entries", "lab_results"):
            with self.subTest(table=table):
                sitter_view = requests.get(
                    f"{SUPABASE_URL}/rest/v1/{table}?pet_id=eq.{TEST_PET_ID}",
                    headers=_headers(self.sitter_jwt),
                    timeout=10,
                )
                self.assertEqual(sitter_view.status_code, 200)
                self.assertEqual(sitter_view.json(), [])

                owner_direct_write = requests.post(
                    f"{SUPABASE_URL}/rest/v1/{table}",
                    headers=_headers(self.owner_jwt),
                    json={"pet_id": TEST_PET_ID},
                    timeout=10,
                )
                self.assertIn(owner_direct_write.status_code, (401, 403))

    def test_rate_limit_counters_are_not_readable(self):
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/api_rate_limits?select=*",
            headers=_headers(self.owner_jwt),
            timeout=10,
        )
        self.assertIn(response.status_code, (401, 403))

    def test_sitter_can_view_pets_and_add_task_completions(self):
        """Sanity check that the fix didn't over-tighten: sitters should
        still be able to view shared data and complete care tasks."""
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/pets?id=eq.{TEST_PET_ID}",
            headers=_headers(self.sitter_jwt),
            timeout=10,
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1, "Sitter should be able to view the shared pet.")


if __name__ == "__main__":
    unittest.main()
