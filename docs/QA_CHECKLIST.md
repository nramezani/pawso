# Pawso End-to-End QA Checklist

Last updated: September 21, 2026

Use this checklist on both iOS and Android before each beta build. Test with an
owner account and a separate caregiver or sitter account.

## Current retest queue

- [ ] Password recovery opens Pawso from the newest email link and accepts a new password.
  - Waiting for the temporary Supabase email rate limit to clear.
  - Expo Go redirect allow-list must contain `exp://**`.
  - Native builds must allow `pawso://auth/callback`.
- [ ] Confirm `expo-linking` is committed in `package.json` and the lockfile.
- [ ] Verify Android bottom navigation remains above the system navigation controls.
- [ ] Verify local notifications in Android and iOS development builds (not Expo Go).

## Owner workflow

- [ ] Fresh install creates a temporary session without an error.
- [ ] Welcome screen offers both first-pet setup and returning-user sign-in.
- [ ] A pet can be created with name and species only.
- [ ] Optional health details can be expanded, saved, and viewed later.
- [ ] Existing pets reappear after closing and reopening the app.
- [ ] Switching pets updates Today, timeline, medications, documents, and care.
- [ ] Empty states provide a useful next action.
- [ ] Loading states prevent duplicate submissions.
- [ ] Network failures show retryable, understandable messages.

## Account workflow

- [ ] Anonymous data survives account upgrade.
- [ ] Email verification returns to Pawso rather than localhost.
- [ ] Existing-user sign-in restores the correct household and pets.
- [ ] Invalid credentials show a safe, understandable error.
- [ ] Password recovery email arrives.
- [ ] Recovery link opens the app and allows an 8+ character password.
- [ ] New password can sign in after sign-out.
- [ ] Sign-out creates a clean temporary session and does not expose prior pet data.

## Daily care

- [ ] Today prioritizes overdue, due soon, later, and completed items correctly.
- [ ] Medication dose logging cannot be accidentally duplicated.
- [ ] Care-task completion records the correct member and time.
- [ ] Dates, times, and daylight-saving changes behave correctly.
- [ ] Reminder permission denial is explained without blocking other features.
- [ ] Multi-pet Today cards open the correct pet.

## Health records and AI

- [ ] PDF and image uploads work from physical devices.
- [ ] Unsupported or oversized files are rejected clearly.
- [ ] Extraction remains a proposal until the owner confirms it.
- [ ] Suspected or uncertain diagnoses remain uncertain.
- [ ] Original documents remain private and open with a signed URL.
- [ ] Ask Pawso cites only the selected pet's records.
- [ ] Ask Pawso degrades safely when the backend is unavailable.
- [ ] Health check-ins distinguish owner observations from veterinary records.
- [ ] Vet Visit Prep and Smart Care Plans show their supporting sources.
- [ ] AI safety language does not imply diagnosis or emergency care.

## Household and roles

- [ ] Owner can create a one-use caregiver invite.
- [ ] Owner can create a one-use sitter invite.
- [ ] Invite expiration and invalid-code errors are clear.
- [ ] Caregiver can manage routine care but cannot manage medical records.
- [ ] Sitter can view and complete assigned care without medical access.
- [ ] A second account never sees another household without accepting an invite.
- [ ] Member names appear on relevant completion activity.

## UI and accessibility

- [ ] Primary action is visually clear on every screen.
- [ ] Advanced and optional sections are progressively disclosed.
- [ ] Touch targets are at least 44–48 points.
- [ ] Buttons expose accessible labels, roles, and disabled/selected states.
- [ ] Large text does not clip critical actions.
- [ ] Keyboard does not cover inputs or submit buttons.
- [ ] Errors appear near the action that caused them.
- [ ] Lists remain understandable with 0, 1, 10, and 50 records.
- [ ] Contrast and screen-reader order are acceptable.
- [ ] iPhone safe areas and Android system navigation never cover controls.

## Release gate

- [ ] `npm exec -- tsc --noEmit`
- [ ] `npx expo config --json`
- [ ] Backend compile/tests
- [ ] Supabase RLS integration tests
- [ ] iOS physical-device smoke test
- [ ] Android physical-device smoke test
- [ ] Privacy, consent, disclaimer, export, and deletion controls
- [ ] No secrets or corrupted generated output are committed
