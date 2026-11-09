# Pawso November 15 release gate

This is a release decision checklist, not a promise of Apple approval. The
repository alone cannot prove a working store build or a safe production data
path. Use synthetic records for every test below.

## Code and configuration

- [ ] Merge the SDK 57 patch alignment and confirm GitHub and GitLab CI pass.
- [ ] Confirm the intended EAS project, bundle identifier, iOS version/build
  number, and all production `EXPO_PUBLIC_*` values before building.
- [ ] Keep iPad support off for the first release unless its layout and store
  screenshots have been tested on a real iPad.
- [ ] Reconcile `npm audit` results. The remaining moderate Expo fingerprint
  CLI transitive findings require an upstream compatible fix; do not force an
  Expo SDK downgrade to silence the audit.

## Production data and service

- [ ] Rotate the previously exposed OpenAI credential if that has not already
  been done; confirm Render, Supabase, EAS, Resend, and source-control 2FA.
- [ ] Create a disposable staging Supabase project. Apply migrations in filename
  order through `20261001_vet_record_intake.sql` and run the RLS integration
  test with owner, caregiver, sitter, and revoked member credentials.
- [ ] Apply the verified migration to production once; deploy the matching
  backend commit. `/ready` returning 200 is only a configuration check.
- [ ] Test clinic link creation, browser upload, owner review, expiration,
  reuse, revoke, unsupported/oversized files, and storage cleanup.
- [ ] Verify account/pet/document deletion, export, backup retention, and a
  staging restore drill. Inspect proxy logs for capability URLs.

## Store and device acceptance

- [ ] Enroll in the Apple Developer Program and accept current agreements;
  create the App Store Connect record for `com.narara.pawso`.
- [ ] Publish a real Privacy Policy, Terms, and support page/email. Set their
  production EAS values and complete the App Privacy questionnaire from the
  verified vendor/data map.
- [ ] Build a production iOS binary, install via TestFlight, and test fresh
  install, anonymous upgrade, recovery, invite acceptance/revocation, care
  logging, notification taps and timezone/DST, document/AI consent, clinic
  intake, offline behavior, export, and deletion on a physical iPhone.
- [ ] Test VoiceOver, large text, dark mode, permission denial, and keyboard
  coverage. Capture current iPhone screenshots with synthetic data.
- [ ] Provide App Review with a working demo account or full instructions for
  anonymous use, plus a path to test household and clinic flows.
- [ ] Submit only when the checks above pass; monitor crashes/support during
  TestFlight and use a staged App Store release after review.

## GitLab portfolio

- [ ] Create a GitLab repository under the intended account and mirror this
  GitHub repository after checking the entire history for secrets and real
  records. A public repo can retain deleted historical blobs.
- [ ] Confirm `.gitlab-ci.yml` runs cleanly on the GitLab runner. Add a
  synthetic-data demo, architecture summary, and screenshots of the actual
  release build. Never post live account exports, clinic links, or keys.
- [ ] Link the GitLab project from the resume only after the mirror and
  screenshots are reviewed. Keep GitHub and GitLab in sync deliberately.

If the production/database/device gates cannot be completed by November 15,
ship a tested TestFlight build or portfolio mirror first and postpone public
App Store submission. Apple's review timing is outside the project team's
control.
