# Pawso Product and Technical Audit

Audit date: September 17, 2026  
Repository: `nramezani/pawso`  
Current stage: Functional local MVP

## Executive summary

Pawso has a strong and unusually complete functional MVP. Its core product loop already connects pet profiles, veterinary records, owner-confirmed AI extraction, longitudinal memory, medications, care tasks, reminders, household collaboration, grounded questions, vet visit preparation, health check-ins, and Smart Care Plans.

The application is suitable for continued internal testing. It is not ready for an external beta because its backend still runs on a local computer, AI endpoints are unauthenticated, the complete database schema cannot be recreated from the repository, native notification behavior is not fully tested, and automated tests and privacy controls are missing.

The next milestone is Production Foundation and Security. New marketplace or community features should wait until the beta foundation is complete.

## Current MVP inventory

### Implemented and tested

- Email and password accounts with anonymous-account upgrade
- Multiple cat and dog profiles
- Persistent Supabase data storage
- Private veterinary document storage
- PDF and image upload
- Structured AI extraction with owner review
- Provenance-aware health timeline
- Medication creation, schedules, and dose logs
- Care tasks, completion logs, and Today prioritization
- Local device reminders
- Multi-pet Today view
- Grounded Ask Pawso answers with cited record sources
- Household invitation codes and Owner, Caregiver, and Sitter roles
- Vet Visit Prep with shareable briefings
- Owner-reported symptom and weight Health Check-Ins
- Smart Care Plan suggestions with source evidence and owner confirmation

### Product strengths

- AI outputs are grounded in supplied records instead of unrestricted pet-specific generation.
- Veterinary extraction requires confirmation before becoming part of the timeline.
- Uncertain diagnoses are preserved as suspected, possible, or rule-out rather than silently upgraded.
- Owner observations are distinguished from veterinary records.
- Smart Care Plan suggestions do not choose dates automatically and must be reviewed before scheduling.
- Household permissions distinguish medical management, routine care management, and care logging.

## Critical findings before beta

### P0 Backend deployment

**Current state:** The mobile client uses `EXPO_PUBLIC_API_URL` with a local-network fallback. Testing depends on a developer computer and changing LAN IP address.

**Required outcome:** Deploy FastAPI behind HTTPS with separate development and production environments, health monitoring, secret management, and a stable public API URL.

**Acceptance criteria:**

- The app works when the development computer is off.
- No production build contains a private LAN address.
- Secrets are managed by the hosting platform and never bundled in the mobile app.
- Health checks and basic request/error metrics are available.

### P0 Backend authentication and abuse protection

**Current state:** Remediated for the single-instance MVP. Private AI endpoints verify Supabase access tokens, enforce configurable per-user minute and daily request limits, restrict CORS, cap request fields and uploads, validate file signatures, and return safe errors. A shared rate-limit store is still required before horizontally scaling the API.

**Risk:** Anyone who discovers the API could consume OpenAI credits or submit arbitrary documents.

**Required outcome:** Verify Supabase JWTs on every private endpoint, restrict CORS, apply request and file limits, add per-user rate limits and quotas, and avoid returning raw exception details.

### P0 Reproducible database schema

**Current state:** Household migrations are present, but the repository does not contain the complete original schema for pets, documents, extractions, medical events, medications, schedules, logs, care tasks, and completions.

**Risk:** A fresh Supabase environment cannot be recreated reliably. Production recovery and onboarding another developer would depend on undocumented manual state.

**Required outcome:** Check in an ordered baseline migration and verify that a blank Supabase project can be built entirely from repository migrations.

### P0 Native mobile builds

**Current state:** Expo Go is used for testing. Android notification support is incomplete in Expo Go.

**Required outcome:** Configure EAS development builds for iOS and Android, add production identifiers and signing configuration, and verify notifications on physical devices.

### P0 Automated tests and continuous integration

**Current state:** There are no application tests or GitHub Actions workflows.

**Required minimum coverage:**

- Household RLS roles and cross-user isolation
- Multi-pet data isolation
- Document extraction confirmation
- AI source ID enforcement and uncertainty preservation
- Medication schedule and dose logging
- Care task creation and completion
- Symptom and weight timeline entries
- Date, time, upload size, and file type validation
- TypeScript checks and backend tests on every pull request

### P0 Privacy and user control

**Required before external beta:**

- Privacy policy and terms
- Clear veterinary and AI disclaimer
- Consent language for sending records to an AI provider
- Export-my-data workflow
- Delete-account and delete-data workflow
- Retention rules for uploaded records
- Ability to remove stored veterinary documents

## High-priority MVP improvements

### Record correction and deletion

Users need edit, archive, or delete controls for pet profiles, medications, schedules, care tasks, owner observations, household invitations, and household members. Medical-history corrections should preserve provenance where appropriate.

### Medication lifecycle

Add medication start date, end date, temporary-course support, pause/resume, refill tracking, prescribing clinic, and clearer handling of missed or late doses. Pawso must continue avoiding dose-change recommendations.

### Care task recurrence

Support recurring schedules such as daily, weekly, monthly, and custom intervals. Provide skip, snooze, pause, and end options without destroying completion history.

### Search and trends

Add timeline and document filters, document search, weight history charts, symptom frequency views, medication adherence summaries, and date-range selection.

### Household administration

Allow owners to revoke invitation codes, remove members, change Caregiver and Sitter roles, and inspect who completed a task or logged a dose.

### Resilience and offline behavior

Add clear retry states, network-aware messaging, protection from duplicate submissions, safe partial-failure handling, and synchronization behavior after reconnecting.

### Localization and units

Support kg and lb, user locale date formats, time zones, daylight-saving changes, and eventually English and Persian interface localization.

## AI safety cost and quality

### Existing safeguards

- Structured response models
- Source ID validation for grounded outputs
- Owner confirmation for document extraction
- Explicit uncertainty-preservation prompts
- Restrictions against diagnosis and medication changes

### Required enhancements

- Authenticate all AI requests.
- Add per-user daily and monthly quotas.
- Record token usage, latency, model, endpoint, and failure category without logging private medical content.
- Add timeouts, retries with limits, and graceful degraded behavior.
- Cache safe repeat operations where practical.
- Add prompt and response regression tests using de-identified fixtures.
- Version prompts and record the prompt version used for each extraction.
- Add a visible feedback mechanism for inaccurate AI output.
- Define a retention policy for files and AI request data.

## Security findings

- Production rate limits must move from process memory to a shared store before running multiple API instances.
- Usage tracking currently counts requests rather than model tokens or monetary cost.
- Security-definer database functions require a dedicated review of execute privileges, search paths, and caller validation.
- A complete RLS integration test suite is not present.
- Dependency audit reported moderate advisories but no high or critical advisories. Expo dependencies should be upgraded carefully; automated advice that downgrades Expo must not be applied blindly.

## Reliability findings

- Backend dependencies were previously undocumented, which caused `No module named uvicorn` on a clean environment.
- The backend does not have a deployment health/readiness strategy beyond a basic health route.
- AI operations are synchronous and may become slow for large documents or concurrent users.
- There is no centralized structured logging, crash reporting, or alerting.
- Notification scheduling clears and rebuilds all local reminders, which needs scale and edge-case testing.
- Medication reminders recur indefinitely because medication course dates are not modeled.
- Partial operations that write more than one record need transaction or recovery planning.

## Mobile release readiness

The following must be completed before store submission:

- Replace the temporary app name and slug `pawso-temp`.
- Add iOS bundle identifier and Android package identifier.
- Configure EAS project metadata and build profiles.
- Create production app icons, splash assets, store screenshots, descriptions, support URL, and privacy URL.
- Replace deprecated React Native `SafeAreaView` usage with `react-native-safe-area-context`.
- Test permissions, document picking, storage, notifications, deep links, and background/resume behavior on supported iOS and Android versions.
- Add accessibility labels, dynamic-text checks, contrast checks, and screen-reader testing.

## Maintainability findings

- `src/context/PawsoContext.tsx` has accumulated many domains and should be split into Auth, Pets, Records, Medication, Care, Household, Notifications, and AI modules.
- Several screens destructure far more context than they use.
- Historical `App.before-*` and backup source files should be removed after Git history is confirmed.
- The project README needs complete setup, architecture, migration, environment, testing, and troubleshooting instructions.
- Backend request models and shared source-building logic should be factored into focused modules.
- API response and error types should be shared or generated to reduce client/server drift.

## Future product opportunities

These features should follow a stable beta rather than precede it:

- Shareable veterinarian PDF report
- Symptom photo attachments
- Medication refill reminders
- Advanced weight, symptom, and adherence trends
- Household activity audit trail
- Emergency information card
- Cloud push notifications
- Premium document and AI usage tiers
- Veterinary clinic collaboration
- Tele-vet integration
- Community and moderated forum
- Marketplace and partner offers

## Prioritized implementation plan

### Phase 1 Production Foundation and Security

1. Reproducible backend dependencies and environment documentation
2. Complete baseline Supabase migration
3. Supabase JWT verification on FastAPI endpoints
4. Rate limits, quotas, safe errors, file-signature validation, and restricted CORS
5. Hosted HTTPS backend and production environment configuration
6. EAS development builds for iOS and Android
7. CI checks and foundational automated tests

### Phase 2 Beta Safety and User Control

1. Privacy policy, terms, consent, and disclaimer
2. Data export, account deletion, and document deletion
3. Editing and archiving workflows
4. Household invitation and member administration
5. Error monitoring, analytics, and AI cost tracking
6. Accessibility and native-device QA

### Phase 3 MVP Depth

1. Medication lifecycle and refills
2. Recurring care tasks
3. Search and filtering
4. Weight and symptom trends
5. Notification navigation and cloud push strategy
6. Improved offline and synchronization behavior

### Phase 4 Monetization and Expansion

1. Free and premium entitlement model
2. AI and storage usage limits
3. Exportable veterinarian reports
4. Advanced household history and analytics
5. Clinic, tele-vet, community, and marketplace experiments

## Definition of private beta readiness

Pawso is ready for a small private beta when:

- Production API requests use HTTPS and authenticated users.
- AI usage is rate-limited and observable.
- A fresh database can be recreated from migrations.
- iOS and Android development builds pass core workflows on physical devices.
- Automated checks protect RLS, grounding, and core care workflows.
- Users can delete their account and stored records.
- Privacy, consent, and medical disclaimers are available.
- Errors and crashes can be detected without exposing private pet data.
- Setup, deployment, and recovery instructions are documented.

## Current remediation status

- [x] Functional MVP audit completed
- [x] Vet Visit Prep implemented and tested
- [x] Symptom and Weight Health Check-Ins implemented and tested
- [x] Smart Care Plans implemented and tested
- [x] Reproducible backend setup
- [x] Complete baseline database migration
- [x] Authenticated and rate-limited AI API
- [ ] Hosted production backend
- [ ] Native development builds
- [ ] Automated test and CI foundation
- [ ] Privacy and account controls
