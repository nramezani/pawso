# Pawso external completion checklist

Code cannot perform these account-owner, production-console, legal, or
physical-device actions. Complete them in this order after the completion PR is
merged.

## 1. Security first

- [ ] Revoke the OpenAI key previously pasted into chat and create a new key.
- [ ] Put the new key only in the Pawso Render service. Trigger a redeploy.
- [ ] Review GitHub, Supabase, Render, Expo, OpenAI, and Resend members; enable 2FA.

## 2. Supabase database

- [ ] Open project `dwowtzzmprvmyinqrszj` → SQL Editor.
- [ ] Run `supabase/migrations/20260929_complete_product_foundation.sql` once.
- [ ] Do not rerun or edit older applied migrations; if SQL fails, save the exact error and line.
- [ ] Confirm the `pet-photos` Storage bucket exists and is private.
- [ ] Confirm tables `symptom_entries`, `lab_results`, `medication_log_revisions`, and `api_rate_limits` exist.
- [ ] Create a disposable staging Supabase project and run every migration in filename order.
- [ ] Set staging test credentials and run `python supabase/tests/test_household_role_rls.py`.

## 3. Render

- [ ] Add every variable listed in `PRODUCTION_OPERATIONS.md`, including `RATE_LIMIT_BACKEND=postgres`.
- [ ] Use the server-only Supabase service-role key only in Render.
- [ ] Verify the Resend sender/domain and use that exact address in `PAWSO_INVITE_FROM_EMAIL`.
- [ ] Use current TestFlight/Play/internal beta URLs for invitation download links.
- [ ] Redeploy the merged `main` commit.
- [ ] Open `https://pawso.onrender.com/ready`; it must return HTTP 200 and `{"status":"ready",...}`.
- [ ] Enable GitHub Actions failure notifications for the scheduled readiness workflow.

## 4. Supabase Auth links

- [ ] Site URL must be a real HTTPS support/landing URL, not localhost.
- [ ] Keep `pawso://auth/callback` in Redirect URLs.
- [ ] Configure the password-recovery and confirmation templates to use the redirect URL supplied by Pawso.
- [ ] Send one fresh recovery email per device; do not reuse old links.

## 5. EAS and naming

- [ ] Add the public variables from `PRODUCTION_OPERATIONS.md` to EAS `preview` and `production`.
- [ ] Rename the Expo dashboard project `pawso-temp` to `pawso`.
- [ ] Then update the local slug in a small follow-up commit and verify `eas project:info` still shows project ID `238eaa38-ce78-4157-88bc-09a3493d56f2`.
- [ ] Build fresh Android and iOS preview binaries from merged `main`.

## 6. Physical-device release gate

- [ ] Owner: secure account, recover password, add/edit/photo/archive/restore/delete pet, export data.
- [ ] Documents: upload PDF/image, review/confirm, reopen, archive/restore/delete, open original.
- [ ] Medication: add/edit course/refill, multiple times, give/skip/correct, snooze, pause/resume, notification tap.
- [ ] Care: one-time and recurring, complete/skip/snooze/pause/resume/end, relaunch history.
- [ ] Health: symptom and weight entries, lab values/ranges, all charts and dark mode.
- [ ] Household: email invite, code/deep link, switch household, change role, revoke/remove, confirm sitter privacy.
- [ ] Owner enables **Account → Offline access**; cached read-only view appears, sitter/caregiver cannot enable it, and every mutation waits for reconnection.
- [ ] iOS: VoiceOver, large text, camera/photo permission, notification permission, DST/timezone test.
- [ ] Android: TalkBack, large text, system navigation safe area, photo permission, notification permission, DST/timezone test.
- [ ] Permanently delete a disposable account and verify Auth, rows, veterinary objects, and pet photos are gone from primary storage.

## 7. Public launch only

- [ ] Legal review and publish Privacy Policy/Terms.
- [ ] Confirm Supabase backup retention/deletion language.
- [ ] Complete a documented backup restore drill.
- [ ] Complete `STORE_RELEASE_CHECKLIST.md` and use staged rollout.
