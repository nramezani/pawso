# Pawso End-to-End QA Checklist

Last updated: September 24, 2026

Use this checklist on both iOS and Android before each beta build. Test with an
owner account and a separate caregiver or sitter account.

## Current retest queue

- [ ] Password recovery opens Pawso from the newest email link and accepts a new password.
  - Waiting for the temporary Supabase email rate limit to clear.
  - Expo Go redirect allow-list must contain `exp://**`.
  - Native builds must allow `pawso://auth/callback`.
- [x] Confirm required Expo native modules are committed in `package.json` and the lockfile.
- [ ] Verify Android bottom navigation remains above the system navigation controls.
- [ ] Verify local notifications in Android and iOS development builds (not Expo Go).
- [ ] Apply migrations through `20260929_complete_product_foundation.sql`
  before testing this release.

## Owner workflow

- [ ] Fresh install creates a temporary session without an error.
- [ ] Welcome screen offers both first-pet setup and returning-user sign-in.
- [ ] A pet can be created with name and species only.
- [ ] Optional health details can be expanded, saved, and viewed later.
- [ ] Photo add/change/remove works; signed photo access expires safely.
- [ ] Pet archive/restore and permanent delete use clear confirmations.
- [ ] Emergency card preview and shared PDF contain only the selected pet.
- [ ] Existing pets reappear after closing and reopening the app.
- [ ] Switching pets updates Today, timeline, medications, documents, and care.
- [ ] Empty states provide a useful next action.
- [ ] Loading states prevent duplicate submissions.
- [ ] Network failures show retryable, understandable messages.

## Account workflow

- [ ] Anonymous data survives account upgrade.
- [ ] Email verification returns to Pawso rather than localhost.
- [ ] Existing-user sign-in restores the correct household and pets.
- [ ] Signing into an existing account from a temporary workspace requires an
  explicit destructive confirmation, removes that temporary workspace, and
  never exposes it after the account switch.
- [ ] Invalid credentials show a safe, understandable error.
- [ ] Password recovery email arrives.
- [ ] Recovery link opens the app and allows an 8+ character password.
- [ ] New password can sign in after sign-out.
- [ ] Repeated recovery taps are held by the 60-second client cooldown.
- [ ] Sign-out creates a clean temporary session and does not expose prior pet data.
- [ ] Export downloads valid JSON and account deletion clears Auth, rows, files,
  local reminders, and the optional offline snapshot.

## Daily care

- [ ] Today prioritizes overdue, due soon, later, and completed items correctly.
- [ ] Medication dose logging cannot be accidentally duplicated.
- [ ] Changing or snoozing a schedule cannot create a second outcome for the
  same original schedule and household day.
- [ ] Medication edit, start/end course, refill, pause/resume, and snooze persist.
- [ ] Give/skip correction creates an audit revision and preserves actor/time.
- [ ] Care-task completion records the correct member and time.
- [ ] Daily/weekly/monthly/custom recurrence survives complete, skip, snooze,
  pause/resume, DST, and relaunch without shifting its intended cadence.
- [ ] Completed care remains in history after refresh/relaunch; archived-only
  tasks are not counted as completed.
- [ ] Seven-day medication activity shows only recorded given/skipped outcomes
  and does not infer missed doses.
- [ ] Dates, times, and daylight-saving changes behave correctly.
- [ ] Reminder permission denial is explained without blocking other features.
- [ ] Multi-pet Today cards open the correct pet.

## Health records and AI

- [ ] PDF and image uploads work from physical devices.
- [ ] Unsupported or oversized files are rejected clearly.
- [ ] A filename over 255 characters and a file over 10 MB are rejected without
  starting AI processing.
- [ ] Extraction remains a proposal until the owner confirms it.
- [ ] Retrying extraction confirmation cannot duplicate timeline events and
  preserves owner-entered values when the AI omitted a field.
- [ ] Suspected or uncertain diagnoses remain uncertain.
- [ ] Original documents remain private and open with a signed URL.
- [ ] Ask Pawso cites only the selected pet's records.
- [ ] Ask Pawso degrades safely when the backend is unavailable.
- [ ] Health check-ins distinguish owner observations from veterinary records.
- [ ] Weight check-in creates one timeline event and updates the profile together.
- [ ] Symptom chart filters one category at a time and shows exact severity/frequency.
- [ ] Lab chart never combines different tests/units and shows a reference band
  only when every displayed record uses a consistent range.
- [ ] Timeline filters and six-month activity use the correct local dates.
- [ ] Vet Visit Prep and Smart Care Plans show their supporting sources.
- [ ] AI safety language does not imply diagnosis or emergency care.

## Household and roles

- [ ] Owner can create a one-use caregiver invite.
- [ ] Owner can create a one-use sitter invite.
- [ ] A temporary anonymous account cannot send or accept a household invite;
  securing or signing in exposes the same pending code afterward.
- [ ] Direct invite email contains the role, one-time code, app link, download
  links, and Account → People & access fallback.
- [ ] Invite expiration and invalid-code errors are clear.
- [ ] Caregiver can manage routine care but cannot manage medical records.
- [ ] Sitter can view and complete assigned care without veterinary documents or
  timeline access; confirm the intended safety-profile fields separately.
- [ ] A second account never sees another household without accepting an invite.
- [ ] Owner can switch household, change caregiver/sitter role, revoke a pending
  invite, remove a member, and see access stop after refresh/relaunch.
- [ ] Sitter cannot open documents, timeline, health trends, or medical AI from
  tabs, deep links, or stale navigation state.
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
- [ ] System, light, and dark appearance modes remain legible on every screen.
- [ ] Owner-only offline access is off by default; after opt-in it is read-only,
  strips stale photo links, blocks mutations, and clears when disabled/signed out.
- [ ] The reminder disclosure explains that medication/task text can appear on
  the lock screen before notifications are enabled.

## Release gate

- [ ] `npm exec -- tsc --noEmit`
- [ ] `npm run lint:all`
- [ ] `npx expo-doctor`
- [ ] `npx expo config --json`
- [ ] Android and iOS `npx expo export` bundle checks
- [ ] Backend compile/tests
- [ ] Supabase RLS integration tests
- [ ] iOS physical-device smoke test
- [ ] Android physical-device smoke test
- [ ] Privacy, consent, disclaimer, export, and deletion controls
- [ ] No secrets or corrupted generated output are committed
