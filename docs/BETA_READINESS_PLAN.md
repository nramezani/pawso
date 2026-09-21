# Pawso Beta and Business Readiness Plan

## Gate 1 — Repair and reproducibility

- [x] Repair committed Expo configuration.
- [x] Declare the Expo Linking dependency.
- [ ] Commit the locally generated lockfile after `npx expo install expo-linking`.
- [ ] Add CI for TypeScript, Expo config parsing, backend tests, and secret scanning.
- [ ] Remove obsolete backups and verify a clean clone can build.

## Gate 2 — Safety and privacy

- [ ] Publish reviewed Privacy Policy and Terms.
- [ ] Add a clear “not veterinary advice / not for emergencies” experience.
- [ ] Add explicit AI-processing consent with timestamp and policy version.
- [ ] Add document, pet, household, and account deletion.
- [ ] Add data export.
- [ ] Define retention, backup deletion, breach response, and vendor inventory.

## Gate 3 — Product completeness

- [ ] Edit and archive records without losing provenance.
- [ ] Recurring care tasks with skip, snooze, pause, and end.
- [ ] Medication start/end dates, course status, and refills.
- [ ] Household invite revocation, role change, and member removal.
- [ ] Search/filter and weight/symptom trends.
- [ ] Emergency pet card and exportable veterinarian/caregiver handoff.

## Gate 4 — Native quality

- [ ] iOS development build and physical-device workflow pass.
- [ ] Android development build and physical-device workflow pass.
- [ ] Password recovery deep-link pass on both platforms.
- [ ] Notification permission, scheduling, tap-through, timezone, and DST tests.
- [ ] Accessibility review with large text and screen readers.
- [ ] Crash reporting and privacy-safe operational monitoring.

## Gate 5 — Membership

- [ ] Implement household entitlements and visible usage meters.
- [ ] Configure App Store and Play subscriptions.
- [ ] Validate receipts server-side and handle renewals/refunds.
- [ ] Preserve export/deletion and existing data after downgrade.
- [ ] Test free, Plus, and Family plan descriptions before final prices.
- [ ] Add support, refund, billing, and cancellation documentation.

## Recommended order of implementation

1. CI and clean-clone validation.
2. Privacy/consent/disclaimer and deletion/export.
3. Native recovery/notification tests.
4. Record editing and recurring care.
5. Emergency card, trends, and reports.
6. Membership infrastructure.
7. Small private beta.
