# Pawso App Store submission packet

**Prepared:** November 10, 2026. This is a working packet, not a submitted
App Store listing or a legal sign-off. Use the current build and verified
production configuration when entering answers in App Store Connect.

## Current evidence and release blockers

The production API and matching migrations were checked, and an owner tested a
physical iPhone **internal preview** at commit `753c812`: pet creation,
one-time clinic link, synthetic upload, review, secure original, expired reuse,
and test-pet deletion. Staging role/RLS integration tests passed 8/8. An
internal preview is not a TestFlight build. The current Android install predates
these changes. No TestFlight upload, App Review submission, or store approval is
recorded here.

Before publishing legal pages or entering their URLs:

- Identify the operator (the enrolled individual or registered entity) and a
  suitable business contact
  address. Do not publish a personal home address or an unmonitored inbox.
- The selected public support/privacy inbox is `pawso.support@gmail.com`;
  the owner reported a successful send-and-reply test on November 10. Keep it
  monitored and enable account recovery/2FA.
- Verify the actual Supabase backup/restore window and Render, OpenAI, Resend,
  and Expo retention settings. The policy must describe deletion accurately.
- The owner's production dashboard screenshot showed a Free Supabase plan.
  Supabase states this plan has no automatic database backups. Confirm the
  current production plan and establish a tested backup/restore process before
  inviting real customers; do not imply that automatic backups exist.
- Finish the legal and data-flow review of the privacy and terms drafts. Make
  stable public HTTPS pages and test them while signed out.
- Set `EXPO_PUBLIC_PRIVACY_POLICY_URL`, `EXPO_PUBLIC_TERMS_OF_USE_URL`, and
  `EXPO_PUBLIC_SUPPORT_EMAIL` in the **production** EAS environment, build
  again, and check all three Account links on the TestFlight install.

## Suggested English listing text

**Name:** Pawso

**Subtitle:** Pet care, records & handoffs

**Category:** Lifestyle (verify the chosen category in App Store Connect).

**Description:**

Keep your pet's care information together. Pawso helps your household track
medications, care tasks, reminders, health notes, and veterinary documents.
Give caregivers the information they need, and keep control of household access.

Add a record yourself or create a one-time link for a clinic to send a PDF or
image. Review every incoming record before treating it as part of your pet's
care history. Prepare for a vet visit and use optional AI tools to summarize
selected information, with your review before saving extracted details.

Pawso is an organizational tool. It does not provide veterinary diagnosis,
prescriptions, emergency monitoring, or a direct connection to a clinic's
records system. Availability of AI features depends on service connectivity.

**Keywords, draft:** pet care,vet records,medication,pet health,caregiver,reminder

Do not describe clinic senders as verified veterinarians or promise automatic
test results. Paid subscriptions are not implemented.

## App Privacy worksheet (verify before submission)

Apple asks about collection by the app **and its third-party partners**. Do
not choose “Data Not Collected.” The table maps likely App Store Connect data
types to observed product behavior; the owner must confirm purpose, retention,
and linked-to-user answers against the live vendor configuration. No ads or
tracking SDK was found in `package.json`; verify vendor behavior before
selecting “No” for tracking.

| Apple data type to consider | Pawso source and purpose | Likely linked? | Verify |
| --- | --- | --- | --- |
| Contact Info → Email Address; Name | Account sign-in, household display, invitations and support | Yes | Which profile fields are persisted and what Resend retains |
| Identifiers → User ID | Supabase Auth, RLS, household membership | Yes | Supabase and API log retention |
| User Content → Photos or Videos; Other User Content | Pet photos, veterinary PDFs/images, notes, questions, AI output, clinic uploads | Yes | Selected file content, AI request handling, provider retention |
| Diagnostics → Crash Data or Other Diagnostic Data | Authenticated crash fingerprint, platform, app version sent to the API | Likely yes at collection | Exact Apple subcategory and Render log retention |
| Usage Data → Product Interaction / Other Usage Data | Care completions, dose logs and household audit events are stored as product records | Yes if classified as usage | Apple's definition versus product content; any provider telemetry |
| Contact Info → Phone Number | Optional clinic and emergency contact details | Possibly | Whether values identify a person and are sent off device |

App functionality is the primary purpose for account, pet, care and document
data; diagnostics are for reliability/security. AI is invoked on selected
context after consent. Confirm whether any data is used for analytics or other
purposes before answering Apple. No payment or purchase collection is intended
in this build. Do not mark pet medical records as human Health data without
reviewing Apple's exact definitions and the contents users can upload.

Apple's current [App Privacy instructions](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
require a public Privacy Policy URL and data handling answers; the
[data-type guide](https://developer.apple.com/app-store/app-privacy-details/)
explains linked data and third-party disclosure.

## Screenshots from the actual TestFlight build

Use synthetic pet names and records, with no real email, medical results,
household invite code, clinic token, notification content, or account ID.
Capture the actual iPhone UI, with status bar and content legible:

1. Today: next care task for a fake pet.
2. Pet profile: care summary and veterinary clinic area.
3. Medical Records: synthetic reviewed record and clear source/status.
4. Care or Medications: a synthetic routine and logging action.
5. Household access or emergency card: sample roles and handoff information.

Use the iPhone screenshot well in App Store Connect; check its current required
device size before uploading. iPad screenshots are unnecessary while
`ios.supportsTablet` is `false`. Apple currently asks for at least one required
iPhone screenshot and accepts up to ten per device size:
[screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications).
Do not fabricate app screens or use a preview build that differs from the
submitted binary.

## TestFlight and submission sequence

1. From clean `main`, record the commit, verify the **production** EAS values,
   and run `npx eas-cli@latest build --platform ios --profile production`.
   This is a store-signed build, unlike the internal `preview` profile.
2. After a successful build, run
   `npx eas-cli@latest submit --platform ios --profile production --latest`.
   Complete Apple authentication/credential prompts on the owner's device.
   Submission sends a build to App Store Connect/TestFlight, not to public
   App Review. Wait for processing.
3. In App Store Connect → Pawso → TestFlight, add the processed build to an
   internal tester group and install through Apple's TestFlight app. Enter a
   monitored beta feedback email. External tester distribution can require
   Beta App Review.
4. Repeat fresh install, recovery, anonymous upgrade, caregiver/sitter invite
   and revoke, care/medication logging, notification permission/tap, offline
   behavior, document review, export and account deletion on disposable data.
   Check VoiceOver, large text, dark mode and policy/support links. Record build
   number and results. A successful preview test is not a substitute.
5. In the iOS version page, add screenshots, description, support URL, privacy
   URL, age rating, availability and other required metadata. Complete App
   Privacy from the verified worksheet, export compliance, and review details.
   Provide a disposable demo account or clear anonymous steps and explain how
   to exercise clinic and household flows without real records. Select the
   tested build and submit for App Review only after critical checks pass.

Expo: [production iOS build](https://docs.expo.dev/tutorial/eas/ios-production-build/),
[TestFlight submission](https://docs.expo.dev/submit/testflight/). Apple:
[TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/),
[App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

## Review notes template

Pawso helps pet owners organize records and care with household role controls.
The clinic link is created by an owner; it accepts one PDF or image, expires,
and does not authenticate the sender as a veterinarian. Incoming files require
owner review. AI output is optional and must be checked by the owner. Pawso
does not provide veterinary diagnosis. The Account screen contains export,
delete account, privacy, terms and support actions. Provide the reviewer with
separately created demo credentials in App Store Connect's secure review fields,
never in this repository. Give a disposable pet and test file; revoke the
review link when review is complete.

## Sign-off record

| Gate | Result | Evidence to attach |
| --- | --- | --- |
| Published privacy/terms/support | Pending | Public HTTPS URLs and monitored contact |
| App Privacy and metadata | Pending | Saved App Store Connect form review |
| Real iPhone screenshots | Pending | Synthetic capture from submitted binary |
| Production iOS/TestFlight | Pending | EAS build ID, App Store Connect build number, installed TestFlight |
| Full physical regression | Pending | Device, iOS version, role test log |
| Public App Review | Pending | Submission and decision |

Keep the app in TestFlight if access, data deletion, private files or a core
journey fails. Apple review timing cannot be guaranteed.
