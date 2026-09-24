# Pawso Deep Product, Workflow, UI, and Engineering Audit — 2026-09-24

## Executive result

Pawso is a coherent and useful **private-beta product** once the new database
migration is applied and the external release checks below are completed. The
core loop now makes sense end to end: create or recover an account, add a pet,
record care and medication activity, upload and confirm veterinary records,
ask grounded questions, share care with another person, and revoke access.

No unresolved TypeScript, lint, Expo configuration, mobile bundle, or backend
test failure was found in this audit. Pawso is **not yet ready for a public app
store release** because data export/deletion controls, legal publication,
production operations, staging RLS verification, and store work remain.

## Scope and method

The review covered:

- Every mobile screen and navigation path on owner, caregiver, and sitter roles.
- Authentication, password recovery, temporary-account upgrade, invitation,
  member removal, and invitation revocation.
- Pet profiles, medical timeline, documents, AI review, medications, care tasks,
  notifications, Ask Pawso, Smart Care, and Vet Visit Prep.
- Supabase schema, RLS migrations, state-changing RPCs, and cross-pet state.
- FastAPI authentication, upload validation, rate limits, AI boundaries,
  invitation email, and account deletion.
- Color contrast, touch targets, safe areas, empty/error/loading states,
  information density, and chart semantics.
- Expo/EAS configuration, CI, dependencies, Android/iOS bundling, and release
  documentation.

This was a static and automated review. It does not replace the physical-device
and live staging-project tests listed below.

## Improvements completed in this pass

### Data correctness and safety

- Care loading now retains completed records instead of fetching only active
  tasks. The active list, progress, history, Ask Pawso, and Vet Visit Prep now
  agree about what was completed and by whom.
- Medication history now loads seven days of actual `given`/`skipped` outcomes.
  The UI no longer invents a `missed` status that does not exist in the schema.
- Medication creation and weight check-in now use transactional RPCs, avoiding
  a medication without schedules or a weight event without a matching profile
  update after a partial failure.
- Care completion is constrained to one completion per task and direct client
  inserts are removed; the audited completion RPC remains the write path.
- Public/anonymous execution is revoked from Pawso's exposed helper and
  state-changing database functions; authenticated execution is explicit.
- Switching pets clears pet-scoped records before the next fetch, preventing a
  failed or slow request from temporarily showing the previous pet's data.
- Temporary document-picker files are deleted after upload/persistence and the
  extraction response is no longer printed to the development console.

### Workflow and UI clarity

- Owners alone see pet-creation controls; medical and care tools now match the
  active household role more consistently.
- Signing into a different account from a temporary workspace now warns that
  records will not be transferred.
- The account screen states truthfully that full data export is not available
  yet, including in the destructive deletion warning.
- Manual household shares include a `pawso://invite/...` link, the one-time
  code, and the correct **Account → People & access** fallback instructions.
- Care completion history is available in context, sorted newest first, with
  actor and timestamp. The screen caps the rendered list at ten and says so.
- Timeline and document filters reduce long-list overload without hiding data.
- Important press targets are at least 44 points high; archive actions have
  full-size circular targets; muted text contrast was strengthened.
- Health check-in errors appear next to the action and incomplete submissions
  are disabled.
- A native branded splash configuration now uses the Pawso mark in release
  builds rather than relying only on the in-app loading screen.

### Automated release protection

- CI now type-checks, lints, parses Expo configuration, runs backend/security
  tests, scans dependencies/secrets, and creates both Android and iOS bundles.

## Visualization review

Charts are used only when the underlying data supports an honest comparison.
They show exact values and include text or accessibility labels; none claims to
diagnose health or infer an unrecorded event.

| Area | Decision | Reason |
| --- | --- | --- |
| Today | Keep progress and compact metrics | Best view of work remaining today |
| Pet profile | Keep weight trend | Repeated numeric measurements support a real trend |
| Medications | Added seven-day given/skipped activity | Uses recorded outcomes; explicitly does not infer adherence |
| Care | Keep progress; add completion history | A list with actor/time is more useful than another chart |
| Health timeline | Added six-month activity chart and filters | Shows record volume/category, not clinical improvement |
| Documents | Keep status metrics; add status filters | Status counts and a list are more actionable than a chart |
| People & access | Keep role metrics | Small categorical summary; no chart needed |
| Ask/Vet Prep/Smart Care | Keep source/category metrics | Makes evidence coverage visible without distracting from output |
| Symptoms | Defer trend chart | Symptoms lack structured category/severity/frequency fields |
| Lab results | Defer trend chart | Labs lack test name, unit, reference range, and numeric schema |
| Refills/courses | Defer chart | Medication start/end/refill data is not modeled yet |

Adding symptom, lab, or adherence charts now would create false precision. Add
those visualizations only after the structured data models in the roadmap exist.

## Workflow findings

| Workflow | Current status | Remaining risk or next improvement |
| --- | --- | --- |
| Temporary account → secured account | Coherent, with password guidance | Retest verification link on both physical platforms |
| Existing account sign-in | Coherent, with temporary-data warning | A true merge/transfer workflow is not implemented |
| Password recovery | Deep-link handling exists | Retest one fresh link per physical platform and verify Supabase production URLs |
| Add/edit pet | Owner-gated and understandable | Add pet archive/delete and structured DOB later |
| Veterinary upload/review | Consent, uncertainty, warnings, reopen, atomic confirm | Add document delete and retention controls |
| Medication | Add schedule, today log, archive, seven-day history | Add edit, course dates, refills, pause, correction audit, timezone model |
| Care | Add, complete, archive, actor history | Add recurring tasks, snooze/skip/pause, pagination |
| Household sharing | Email/share/code/deep link, recipient binding, revoke/remove | Add role changes and explicit multi-household switching |
| AI features | Authenticated, grounded, source-labeled, capped | Add privacy-safe monitoring and graceful source pagination |
| Notifications | Local reminders and tap routing | Physical-device permission, timezone, DST, and relaunch tests |
| Account deletion | Implemented with shared-owner safeguards | Full export, pet deletion, document deletion, retention validation |

## Prioritized remaining work

### P0 — complete before the next private-beta build

1. Apply `supabase/migrations/20260928_harden_rpc_access_and_care_history.sql`
   to the same Supabase project used by the preview build. Medication creation
   and weight check-in in this version depend on its RPCs.
2. Rotate the OpenAI key that was previously pasted into chat, update Render,
   and revoke the old key. Never place the replacement in GitHub or EAS public
   variables.
3. Verify Render has `ENVIRONMENT=production`, the account-deletion service key,
   Resend configuration, invitation deep-link base, and current beta download
   URLs. Confirm `/ready` after redeploying.
4. Build a fresh EAS preview for Android and iOS. Test owner, caregiver, and
   sitter flows on physical devices, including app relaunch and revoked access.
5. Run the live RLS suite against a disposable staging Supabase project with
   dedicated owner/caregiver/sitter accounts.
6. Retest password recovery and invitation deep links with one fresh email on
   each platform; confirm no route falls back to localhost.

### P1 — complete before a public store release

1. Implement downloadable structured data export plus pet and document
   archive/delete. Verify storage deletion and documented retention windows.
2. Obtain legal review, publish the Privacy Policy and Terms, set their EAS
   environment URLs, and complete App Store privacy/Play data-safety forms.
3. Add privacy-safe crash reporting, API error/latency metrics, uptime checks,
   alerts, backup/restore drills, and a support contact/process.
4. Model medication schedules with an explicit household/pet timezone and test
   DST/travel behavior; add an audit-preserving way to correct dose logs.
5. Add medication edit, start/end dates, course/refill state, and reminder
   pause/snooze controls.
6. Add recurring care schedules with skip/snooze/pause/end behavior.
7. Add an explicit household switcher and owner-driven role changes. Confirm
   and document exactly which profile health fields sitters may see.
8. Rename the Expo project/slug from `pawso-temp`, prepare store metadata,
   screenshots, support/privacy URLs, signed production builds, and submission
   checklists.

### P2 — useful product enhancements after beta evidence

1. Emergency pet card and veterinarian/caregiver handoff PDF/share flow.
2. Structured symptom tracking (category, severity, frequency, duration) and
   only then symptom visualizations.
3. Structured lab results (test, value, unit, range, date) and only then lab
   trends with unit/range safeguards.
4. Search, pagination, and date-range filters for larger histories.
5. Offline/read-only resilience and clearer connectivity recovery.
6. Refactor the oversized `PawsoContext.tsx` into typed auth, pets, medical,
   medication, care, household, and AI services/stores. Reduce the existing lint
   warning backlog while preserving behavior with tests.
7. Move rate-limit counters to Redis/Postgres before running more than one API
   instance.
8. Keep the beta free; design server-verified memberships and store receipt
   validation only after retention and shared-care usage justify them.

## Verification evidence

- TypeScript (`tsc --noEmit`): pass.
- ESLint blocking rules: pass.
- Expo Doctor: 21/21 checks pass.
- Expo configuration parse: pass.
- Android production-style Metro export: pass (1,076 modules).
- iOS production-style Metro export: pass (1,079 modules).
- Backend/security/migration contract tests: 20 pass.
- Python dependency audit: no known vulnerabilities.
- npm audit: 11 moderate, 0 high, 0 critical. Findings are in the supported
  Expo/build-tool chain; the suggested forced fix incorrectly downgrades Expo,
  so upgrades must stay within an Expo-supported SDK path.
- Tracked-file secret pattern scan: no committed production secret found.

## Release decision

Proceed to a small private beta after all P0 items pass. Do not market Pawso as
publicly launch-ready until the P1 privacy, data-rights, operations, timezone,
and store requirements are completed.
