# Pawso production operations

## Service objectives

- `/health` proves the FastAPI process is running.
- `/ready` proves all required production configuration is present.
- GitHub Actions calls `/ready` every six hours. Enable repository Action failure
  notifications for the owner. Before a public launch, add a dedicated external
  monitor with 5-minute checks and email/SMS escalation.
- API logs contain request ID, route, status, and latency only. They must not
  contain tokens, query bodies, email addresses, pet names, or veterinary text.
- Mobile crash events contain only kind, opaque fingerprint, platform, and app version.

## Required production environment

Render:

```text
ENVIRONMENT=production
RATE_LIMIT_BACKEND=postgres
OPENAI_API_KEY=...
OPENAI_MODEL=...
SUPABASE_URL=...
SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
PAWSO_INVITE_FROM_EMAIL=Pawso <invites@verified-domain.example>
PAWSO_INVITE_BASE_URL=pawso://invite
PAWSO_IOS_DOWNLOAD_URL=...
PAWSO_ANDROID_DOWNLOAD_URL=...
```

EAS `development`, `preview`, and `production` environments:

```text
EXPO_PUBLIC_API_URL=https://pawso.onrender.com
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
EXPO_PUBLIC_PRIVACY_POLICY_URL=...
EXPO_PUBLIC_TERMS_OF_USE_URL=...
EXPO_PUBLIC_SUPPORT_EMAIL=...
```

Never put `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, or `RESEND_API_KEY`
in EAS public variables.

## Incident levels

| Level | Example | Initial action target |
| --- | --- | --- |
| SEV-1 | Cross-household data exposure, leaked server key, destructive data bug | Stop affected operation immediately; rotate/revoke; preserve evidence; contact privacy/legal lead |
| SEV-2 | Login, recovery, upload, invite, or deletion unavailable for many users | Acknowledge within the same business day; mitigate or roll back |
| SEV-3 | Single-screen failure or degraded noncritical feature | Record, reproduce, prioritize for next patch |

These are internal targets, not contractual uptime/support promises.

## Incident procedure

1. Record UTC start time, affected release/commit, routes, and request IDs.
2. Avoid copying tokens, email bodies, vet records, or screenshots with personal data into issues.
3. For suspected exposure, disable the route/service or roll back first.
4. Rotate the relevant Render/Supabase/OpenAI/Resend credential.
5. Check Supabase Auth/database/storage logs, Render deploy/runtime logs, and GitHub deployments.
6. Validate RLS with disposable test accounts before restoring service.
7. Document cause, affected data/users, mitigation, and prevention.
8. Obtain legal advice on Canadian/BC breach-notification duties when personal information may be affected.

## Backup and restore drill

Before public launch and quarterly afterward:

1. Confirm the active Supabase backup/PITR feature and retention window.
2. Create a disposable staging project in the same region.
3. Restore the latest production backup or a sanitized backup to staging.
4. Apply all repository migrations in order.
5. Verify counts for households, pets, documents, medication logs, care completions, symptoms, and labs.
6. Verify private Storage objects and signed URL access with owner/caregiver/sitter accounts.
7. Run `supabase/tests/test_household_role_rls.py` against staging.
8. Record date, recovery time, missing objects, and corrective action. Never run destructive drill steps on production.

## Release and rollback

1. Require green `quality.yml` and review the migration diff.
2. Apply migrations to staging and run role/RLS/device tests.
3. Deploy backend and confirm `/ready` returns HTTP 200 with `status: ready`.
4. Publish/build mobile only after backend compatibility is confirmed.
5. For a backend failure, roll Render back to the last green commit.
6. Database migrations are forward-only. Add a corrective migration; do not edit an applied migration or reset production.
7. EAS Update may deliver JavaScript-only fixes when runtime version is compatible. Native dependency/config changes require a new binary.

## Support process

- Publish one monitored support address and configure `EXPO_PUBLIC_SUPPORT_EMAIL`.
- Use ticket labels: account/recovery, privacy/deletion, billing (future), data error, app failure, feedback.
- Verify identity before discussing account-specific data. Never request a password or service token.
- Escalate deletion/export failures and suspected privacy events immediately.
- Maintain a public support page before store submission.

