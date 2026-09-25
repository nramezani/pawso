# Pawso release readiness review — 2026-09-24

## Decision

The planned product and engineering scope is code-complete for a controlled
private beta. Release remains blocked until the account owner completes the
external checklist: rotate the exposed API key, apply migration `20260929`,
configure/redeploy production, verify live staging RLS, and pass the physical
iOS/Android test matrix.

## Completed release work

- Full pet lifecycle, private pet photos, emergency profile, and shareable PDF.
- Full medication lifecycle with courses/refills, edit/pause/snooze, atomic dose
  logging, and audit-preserving corrections.
- Recurring care lifecycle with skip/snooze/pause/end and actor history.
- Structured weight, symptom, and lab entry plus clinically honest charts.
- Veterinary upload/extraction/review/confirmation with consent, provenance,
  uncertainty, archive/restore/download/delete, and private-object cleanup.
- Household email/code/deep-link invitation, switcher, timezone, role changes,
  revocation/removal, and sitter medical-privacy boundaries.
- Auth recovery callbacks, temporary-account protection, cooldown/error UI,
  relaunch recovery, and clean sign-out/deletion state.
- JSON export; pet, document, and account deletion; retention/vendor draft.
- Owner-only opt-in read-only offline mode and system/light/dark appearance.
- Accessible visuals, touch targets, large-list controls, Android safe areas,
  native splash/logo, error boundary, and privacy-safe diagnostics.
- Production health/readiness, Postgres rate limiting, scheduled uptime check,
  operations/backup/support/store runbooks, and hardened CI.

## Database requirement

Apply every migration in filename order. Existing Pawso production projects
that already have migrations through `20260928` need only:

`supabase/migrations/20260929_complete_product_foundation.sql`

It adds the data model, private photo storage, RLS, audited/atomic RPCs, shared
rate limiting, and direct-write restrictions required by app version `1.1.0`.
Apply it to staging first; database migrations are forward-only.

## Verification

| Gate | Result |
| --- | --- |
| TypeScript | Pass |
| ESLint, zero warnings | Pass |
| Expo config | Pass |
| Expo Doctor | 21/21 pass |
| Android/iOS Metro export | Pass / pass |
| Backend tests | 32 tests pass |
| Python compile | Pass |
| SQL parse | 10 migrations, 415 statements pass |
| Python dependency audit | No known vulnerabilities |
| npm audit | 13 moderate; 0 high/critical; no incompatible forced fix applied |

## Manual evidence still required

- Live disposable-staging role/RLS run with separate owner, caregiver, and
  sitter accounts.
- Fresh recovery and invitation link on both physical platforms, with no
  localhost fallback.
- Relaunch, offline opt-in, notification tap, timezone/DST, role revocation,
  storage deletion, export, camera/photo, accessibility, and dark-mode matrix.
- Store-signed TestFlight and Play internal builds; Expo Go is insufficient for
  native notifications, splash/icon, permissions, and release behavior.
- Legal review and publication of the policies, verified backup retention,
  store privacy declarations, support page/inbox, and staged rollout plan.

Use `docs/EXTERNAL_COMPLETION_CHECKLIST.md` for exact owner steps and
`docs/STORE_RELEASE_CHECKLIST.md` for public submission.
