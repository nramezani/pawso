# Pawso Release Readiness Review — 2026-09-24

This review covers the mobile app, FastAPI backend, Supabase migrations,
authentication and household workflows, AI-assisted document extraction,
notifications, accessibility, and release tooling.

## Completed in the release-readiness repair batch

- Fixed 24-hour medication time validation (`08:00` and other valid values now
  pass while malformed values remain blocked).
- Changed medication and care-task removal to archive records, preserving dose
  and completion history.
- Made care-task completion transactional with its audit entry.
- Made AI extraction confirmation transactional with timeline creation and
  idempotent against retries.
- Added extraction model and prompt-version provenance.
- Preserved and exposed diagnosis certainty, extraction warnings, and medication
  text during owner review; extracted medications never change an active
  schedule automatically.
- Added first-use AI document-processing consent and an account control that
  resets it.
- Added a way to reopen pending AI reviews from Documents.
- Persisted the selected household per user and fall back to the most recently
  joined valid household, preventing an empty personal household from replacing
  shared care after relaunch.
- Bound addressed invitations to the authenticated recipient email.
- Fixed invitation revocation to use the database's allowed `revoked` status.
- Cleared all user-scoped state and local reminders during sign-out/account
  deletion, then prepared a fresh anonymous workspace.
- Added editable pet profiles for household owners.
- Added strict local-date parsing, avoiding UTC date shifts and impossible dates.
- Added notification tap routing to the relevant pet's medication or care view.
- Added startup, retry, and crash-fallback screens to prevent silent blank states.
- Improved password guidance, keyboard handling, Android-safe navigation
  contrast, touch targets, tablet content width, branding, and dense Today-page
  tool presentation.
- Added the new logo to the in-app welcome/loading experience and aligned the
  Android adaptive-icon background.
- Made clean CI installs reproducible with `npm ci` and declared the required
  `expo-font` peer directly.
- Added accessible, data-backed visual summaries across the pet profile, Today,
  medications, care, timeline, documents, household, Ask Pawso, Smart Care, and
  vet-preparation screens. The weight chart shows exact recorded values and
  deliberately avoids making a clinical judgment about weight change.

## Database migrations that must be applied

Apply these in order to the Supabase project before testing this batch:

1. `20260925_fix_household_invitation_cancellation.sql`
2. `20260926_atomic_care_completion.sql`
3. `20260927_atomic_extraction_confirmation.sql`

The first migration also secures addressed invitation codes to the recipient's
signed-in email. The latter two add transactional RPCs used by this app version.

## Automated verification

- TypeScript: pass
- ESLint blocking errors: pass
- Expo configuration parse: pass
- Python compile: pass
- Backend and migration contract tests: 19 pass
- Medication-time regression check: pass for valid and invalid boundary cases

The live Supabase RLS suite still requires a disposable staging project and the
owner/caregiver/sitter test accounts described in
`supabase/tests/test_household_role_rls.py`.

## Manual device tests required before private beta

- Password reset on iOS and Android using one fresh email link on each device.
- Addressed invite: correct email succeeds; a different signed-in email fails.
- Relaunch as caregiver/sitter and confirm the shared pets remain selected.
- Owner removes a member and revokes a pending invitation; access stops after
  refresh/relaunch.
- Create medication schedules at `00:00`, `08:00`, and `23:59`; reject `24:00`.
- Complete and archive care/medication items; confirm history remains.
- Upload a clear record and an uncertain record, review certainty/warnings, tap
  Review later, reopen from Documents, and confirm once.
- Enable local reminders, tap medication and care notifications, and verify the
  correct pet screen opens. Repeat across a daylight-saving transition in a test
  timezone before public release.
- Large text and VoiceOver/TalkBack pass on Welcome, Account, Today, Review,
  People & access, medications, and care tasks.
- Internal iOS and Android builds with the final icon; splash branding must be
  checked on a release build because Expo Go does not reproduce it exactly.
- Record at least two weights and verify chart ordering, exact values, range,
  accessibility summary, and the link back to the weight check-in flow.

## Still required before public release

### Product and privacy

- Legal review and publication of the Privacy Policy and Terms, plus production
  URLs in EAS environment variables.
- Structured data export and deletion/archive controls for pets and documents.
- Household switching for users who intentionally belong to multiple active
  households, plus owner-driven role changes.
- Recurring care schedules, medication course dates/refills, and edit history.
- Emergency pet card and veterinarian/caregiver handoff export.

### Operations

- Privacy-safe crash reporting and backend monitoring/alerting.
- Staging Supabase project with RLS tests in a protected workflow.
- EAS environment verification for development, preview, and production.
- App Store/Play Store metadata, support contact, data-safety declarations, and
  final production-build review.

### Business

- Keep the private beta free. Validate retention and caregiver usage before
  implementing memberships.
- After validation, implement server-side entitlements and receipt validation;
  do not enforce plans only in the client.

## Dependency note

The current npm audit reports moderate transitive findings but no high or
critical findings. Do not run `npm audit fix --force` against this Expo project;
review upgrades within the supported Expo SDK line instead.
