# Pawso Beta and Business Readiness Plan

## Gate 1 — Repair and reproducibility

- [x] Repair committed Expo configuration.
- [x] Declare the Expo Linking dependency.
- [x] Commit the locally generated lockfile after `npx expo install expo-linking`.
- [x] Add CI for TypeScript, Expo config parsing, backend tests, and secret scanning.
- [x] Remove obsolete backups and verify a clean install passes checks.

## Gate 2 — Safety and privacy

- [ ] Publish reviewed Privacy Policy and Terms.
- [x] Add a clear “not veterinary advice / not for emergencies” experience.
- [x] Add explicit AI-processing consent with timestamp and policy version.
- [x] Add document, pet, and account deletion with shared-household safeguards.
- [x] Add structured data export and original-document download.
- [x] Define retention, backup deletion, breach response, and vendor inventory drafts.

## Gate 3 — Product completeness

- [x] Edit pet profiles and archive care/medication records without losing history.
- [x] Recurring care tasks with skip, snooze, pause, and end.
- [x] Medication start/end dates, course status, refills, edit, pause, and snooze.
- [x] Household switcher and owner-driven role change.
- [x] Weight trend from owner-recorded timeline measurements.
- [x] Timeline and document status filters.
- [x] Structured symptom/lab fields and clinically honest filtered trends.
- [x] Emergency pet card and exportable veterinarian/caregiver handoff PDF.
- [x] Owner-only opt-in read-only offline mode and dark appearance support.

## Gate 4 — Native quality

- [ ] iOS development build and physical-device workflow pass.
- [ ] Android development build and physical-device workflow pass.
- [ ] Password recovery deep-link pass on both platforms.
- [ ] Notification permission, scheduling, tap-through, timezone, and DST tests.
- [ ] Accessibility review with large text and screen readers.
- [x] Privacy-safe mobile diagnostics and scheduled API readiness monitoring.

## Gate 5 — Membership

- [ ] Implement household entitlements and visible usage meters.
- [ ] Configure App Store and Play subscriptions.
- [ ] Validate receipts server-side and handle renewals/refunds.
- [ ] Preserve export/deletion and existing data after downgrade.
- [ ] Test free, Plus, and Family plan descriptions before final prices.
- [ ] Add support, refund, billing, and cancellation documentation.

## Recommended order of implementation

1. Rotate exposed credentials and apply the final migration to staging.
2. Complete native recovery, notification, role/RLS, offline, and accessibility tests.
3. Publish legally reviewed policies and complete production/store configuration.
4. Run a small free private beta and measure retention/shared-care usage.
5. Decide whether membership infrastructure is justified by evidence.
