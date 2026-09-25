# Pawso architecture and trust boundaries

## Runtime shape

- Expo/React Native renders the mobile UI and stores only public configuration.
- Supabase Auth provides sessions; Postgres RLS and audited RPCs are the primary
  authorization and transactional-integrity boundary.
- Private Supabase Storage holds veterinary documents and pet photos. The app
  receives short-lived signed URLs after an authorized database lookup.
- FastAPI verifies the Supabase bearer token before AI, invitation email,
  export, deletion, and diagnostic operations. Server-only credentials remain
  on Render.
- OpenAI receives only user-approved record/context payloads needed for the
  requested AI operation. Resend receives only invitation-delivery fields.

## Mobile boundaries

`PawsoContext` orchestrates authenticated product state and screen actions.
Side-effect-heavy concerns are isolated in services:

| Service | Responsibility |
| --- | --- |
| `notifications.ts` | Local permission, scheduling, sync, and tap routing |
| `dataRights.ts` | Export and destructive backend requests |
| `petPhotos.ts` | Private image selection/upload/signed URL lifecycle |
| `emergencyCard.ts` | Owner-controlled HTML/PDF generation and sharing |
| `offlineCache.ts` | Owner-only opt-in read-only snapshot lifecycle |
| `telemetry.ts` | Bounded, privacy-safe client diagnostics |

Screens use shared theme-aware primitives from `components/ui.tsx`. Navigation
enforces role visibility, while screens and database policies independently
defend sensitive routes.

## Data integrity

Multi-row state changes use security-definer RPCs with fixed search paths,
authenticated caller checks, household-role validation, and explicit execute
grants. Direct writes are revoked where bypassing an RPC would break audit or
transactional guarantees. RLS remains enabled on all user data.

## Deliberate constraints

- Pawso records and summarizes; it does not diagnose, select doses, or infer
  unrecorded adherence.
- Offline mode is read-only and opt-in because the device cache is OS-sandboxed
  but not an application-encrypted medical vault.
- The app context remains large, but external effects have service boundaries.
  Further splitting into domain stores should be incremental and test-backed;
  it is not required to unlock a private beta.
- Membership is not implemented. Future entitlements must be server-verified
  with store receipt validation and must never block export or deletion.
