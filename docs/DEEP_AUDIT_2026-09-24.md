# Pawso deep product, workflow, UI, and engineering audit — 2026-09-24

## Executive result

The code-side P0, P1, and P2 roadmap is complete for the intended private-beta
scope. Pawso now supports the full owner/caregiver/sitter journey from account
creation and pet setup through daily care, medical history, household handoff,
export, and deletion. The remaining release gates are intentionally external:
credential rotation, applying the final migration, production configuration,
live staging RLS tests, physical-device testing, legal publication, and store
submission.

No unresolved TypeScript, lint, Expo configuration, SQL parsing, mobile bundle,
or backend-test failure was found. This is still not a veterinary diagnostic
product, and passing static/automated checks does not replace live RLS and
physical-device verification.

## Scope and method

The review covered every screen and role; authentication and recovery; pet,
document, medication, care, symptom, lab, and timeline workflows; household
invitations and access removal; AI boundaries; notifications; offline behavior;
data rights; storage; Supabase RLS/RPCs; FastAPI security and operations;
accessibility; visual hierarchy; charts; Expo/EAS; CI; dependencies; and release
documentation.

## Completed P0 — safety and correctness

- Authenticated backend routes, bounded AI inputs, shared Postgres rate limits,
  safe request IDs, privacy-safe errors/metrics, upload validation, and readiness
  monitoring.
- Ordered reproducible migrations, restricted function privileges, role-aware
  RLS, atomic medication/care/weight/extraction writes, correction audit trails,
  and pet/household relationship validation.
- Recovery and invitation deep-link handling, verification redirects, account
  upgrade guidance, request cooldowns, household persistence, and blank-screen
  recovery paths.
- Owner/caregiver/sitter navigation and data visibility. Sitters are excluded
  from documents, medical timelines, health trends, and medical AI surfaces.
- Authorized, coordinated account/pet/document deletion, private storage cleanup, JSON
  export, no-store responses, local-state cleanup, and explicit archive versus
  permanent-delete language.
- CI gates for clean install, typecheck, zero-warning lint, Expo Doctor/config,
  Android/iOS bundles, backend tests, dependency audit, and secret scanning.

## Completed P1 — complete daily-care workflows

- Pet edit, structured date of birth, photo upload/removal, archive/restore,
  permanent delete, and emergency details.
- Medication edit, start/end dates, temporary courses, refill fields,
  pause/resume, reminder snooze, multiple schedules, give/skip, and audited
  correction of a logged outcome.
- Recurring care with daily/weekly/monthly/custom cadence, complete/skip,
  snooze, pause/resume, end, preserved recurrence cadence, and actor history.
- Household switcher, timezone setting, role changes, pending-invite revocation,
  member removal, recipient-bound codes, direct email delivery, and fallback
  share text/download links.
- Production operations, privacy-safe mobile diagnostics, scheduled readiness
  check, retention/vendor register, backup/restore procedure, and support path.
- Search, pagination/show-more behavior, filters, date ranges, honest empty and
  error states, Android-safe bottom navigation, accessible targets, and reduced
  dense-screen overload.

## Completed P2 — useful enhancements

- Shareable emergency pet-card PDF with owner-controlled contact and medical
  summary fields.
- Structured symptoms (category, severity, frequency, duration) and category-
  specific visualization.
- Structured lab results (test, numeric value, unit, reference range, date) and
  trend visualization that refuses to combine units or inconsistent ranges.
- Pet photos stored in a private bucket and displayed using expiring signed URLs.
- Owner-only, opt-in, read-only offline snapshots that strip signed photo URLs,
  block mutation while offline, and clear on disable/sign-out/deletion.
- System/light/dark appearance selection and theme-aware status/navigation/UI.
- Extracted mobile service boundaries for data rights, pet photos, emergency
  cards, offline cache, notifications, and diagnostics. The context provider
  remains the orchestration layer; further store splitting is maintainability
  work, not a missing user workflow.

## Visualization decisions

| Area | Visualization | Safety rule |
| --- | --- | --- |
| Today | Completion progress and compact counts | Shows recorded work only |
| Pet profile | Weight trend | Exact values; no diagnosis or ideal-weight claim |
| Medication | Seven-day given/skipped activity | No inferred adherence or dosing advice |
| Care | Progress and actor-stamped history | Completion history stays textual and auditable |
| Timeline | Six-month event activity | Measures record volume, not health improvement |
| Symptoms | Category-filtered severity/frequency trend | Never combines unrelated symptom categories |
| Labs | Test/unit-specific value trend | Reference band appears only when ranges are consistent |
| Documents/household/AI | Status and evidence summaries | Small summaries avoid decorative charts |

## Workflow decisions

| Workflow | Result |
| --- | --- |
| Temporary → secured account | Preserves the anonymous user ID and records; guides email verification |
| Existing-account sign-in | Verifies the destination account first, then explicitly discards the temporary workspace only after confirmation; temporary records are never silently merged |
| Password recovery | App callback and recovery state are implemented; fresh-link device retest remains external |
| Shared care | Email, code, link, recipient binding, role change, switch, revoke, and remove are implemented |
| Medical record | Upload, consent, extract, uncertainty review, atomic confirm, reopen, archive, download, and delete |
| Medication | Full lifecycle, notifications, outcome logging, snooze, correction, and history |
| Care | One-time/recurring lifecycle with audit-preserving history |
| Data rights | JSON export plus document, pet, and account deletion with private-object cleanup |
| Offline | Owner-opted read-only snapshot; writes wait for reconnection |

## Automated verification evidence

- TypeScript: pass.
- ESLint zero-warning policy: pass.
- Expo configuration: pass; app version `1.1.0`, native build number/code `2`,
  automatic appearance.
- Expo Doctor: 21/21 checks pass.
- Android and iOS Metro exports: pass.
- Backend/security/migration contract tests: 32 tests pass.
- SQL: all 10 migrations parse; 415 statements total.
- Python compilation: pass.
- Python dependency audit: no known vulnerabilities.
- npm audit: 13 moderate, 0 high, 0 critical. The reported items are transitive
  Expo/build-chain advisories; the proposed forced fix is incompatible with the
  supported Expo SDK and must not be applied blindly.
- Tracked-file secret scan: no committed production credential found. CI also
  runs Gitleaks against full history.

## Remaining release gates — not code tasks

The authoritative, ordered owner checklist is
`docs/EXTERNAL_COMPLETION_CHECKLIST.md`. The first action is rotating the OpenAI
key previously exposed in chat. Apply migration `20260929`, redeploy Render,
run live role/RLS tests on disposable staging, build fresh iOS/Android binaries,
and complete the physical-device matrix. Public release additionally requires
legal review/publication, verified retention wording, store privacy forms,
metadata/screenshots, support readiness, and staged rollout.

## Release decision

Proceed to a small private beta only after every section 1–6 item in the
external checklist passes. Proceed to a public store rollout only after section
7 and `STORE_RELEASE_CHECKLIST.md` pass. Keep the beta free; paid membership and
receipt validation are a post-evidence business decision, not a current gap.
