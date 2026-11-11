# Pawso

Pawso is an AI-powered pet-care copilot for managing veterinary records, medications, care routines, reminders, household collaboration, and grounded pet-specific questions.

The mobile experience includes accessible visual summaries for weight, symptoms,
lab values, daily care progress, medication logging, current care tasks, health
events, documents, household access, and AI source coverage. It also includes
pet photos, a shareable emergency card, recurring care, medication-course and
refill management, household switching, owner-controlled offline access, data
export/deletion, and light/dark appearance settings.

## Technology

- Expo SDK 57 and React Native
- TypeScript
- Supabase Auth, Postgres, Row Level Security, and Storage
- FastAPI
- OpenAI Responses API with structured outputs

## Mobile application setup

Requirements:

- Node.js 22.13 or newer
- npm
- Expo Go for basic development or an Expo development build for full notification support

Install dependencies:

```powershell
npm ci
```

Create a root `.env.local` file:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
EXPO_PUBLIC_API_URL=https://pawso.onrender.com
```

Start Expo:

```powershell
npx expo start --tunnel --clear
```

## Backend setup on Windows

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and replace the placeholder OpenAI key. Never commit the real `.env` file.
The example also contains the Supabase authentication settings and configurable
AI request and upload limits used by the secured API.

Start the API so a phone on the same network can connect:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verify the backend on the development computer:

```text
http://127.0.0.1:8000/health
```

## Development checks

```powershell
npm exec -- tsc --noEmit
npm run lint:all
```

```powershell
cd backend
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

## Production deployment

The secured FastAPI backend includes a non-root Docker image and separate
health and readiness endpoints. Follow the
[backend deployment guide](docs/BACKEND_DEPLOYMENT.md) to deploy it behind
HTTPS and point the Expo app to the hosted API.

The production API is deployed at `https://pawso.onrender.com`. Its public
health endpoints are `/health` and `/ready`.

## Project documentation

- [Product and technical audit](docs/PAWSO_AUDIT_AND_ROADMAP.md)
- [End-to-end QA checklist](docs/QA_CHECKLIST.md)
- [Beta and business readiness plan](docs/BETA_READINESS_PLAN.md)
- [Privacy policy draft](docs/PRIVACY_POLICY_DRAFT.md)
- [Terms of use draft](docs/TERMS_OF_USE_DRAFT.md)
- [Membership and pricing recommendation](docs/MEMBERSHIP_AND_PRICING.md)
- [Release readiness review (2026-09-24)](docs/RELEASE_READINESS_REVIEW_2026-09-24.md)
- [Deep product, workflow, UI, and engineering audit (2026-09-24)](docs/DEEP_AUDIT_2026-09-24.md)
- [Architecture and trust boundaries](docs/ARCHITECTURE.md)
- [External completion checklist](docs/EXTERNAL_COMPLETION_CHECKLIST.md)
- [Data governance and vendor register](docs/DATA_GOVERNANCE_AND_VENDORS.md)
- [Production operations runbook](docs/PRODUCTION_OPERATIONS.md)
- [App Store and Play release checklist](docs/STORE_RELEASE_CHECKLIST.md)
- [Support](docs/SUPPORT.md)
- [App Store submission packet and privacy worksheet](docs/APP_STORE_SUBMISSION_PACKET.md)
- [EAS environment setup](docs/EAS_ENVIRONMENT_SETUP.md)
- [November 15 release gate](docs/NOVEMBER_15_RELEASE_GATE.md)
- [Backend deployment guide](docs/BACKEND_DEPLOYMENT.md)
- [Baseline Supabase schema](supabase/migrations/20260911_core_schema.sql)
- [Household sharing migration](supabase/migrations/20260912_household_shared_care.sql)
- [Reconciled household role permissions](supabase/migrations/20260923_reconcile_household_role_rls.sql)

Apply all Supabase migrations in filename order, including
`20261001_vet_record_intake.sql` before enabling the clinic upload workflow.
Run the role/RLS checks against a disposable staging project before production.

## Current status

At the November 10, 2026 checkpoint, staging role/RLS tests passed 8/8 and
the production backend and vet intake migrations were checked. An owner tested
the clinic upload, review, one-time link expiry, and disposable pet deletion
on a physical iPhone **preview** build from `753c812`. This is not a TestFlight
build or public App Store approval. A new Android build, published legal and
support pages, App Privacy details, actual screenshots, and full device
regression remain release gates. See the [submission packet](docs/APP_STORE_SUBMISSION_PACKET.md)
for evidence and next steps. Paid membership is not implemented.

## Portfolio notes

This repository demonstrates Expo/React Native, FastAPI, Supabase RLS,
private-file storage, authenticated AI endpoints, and owner-controlled
household permissions. Use synthetic pet records and screenshots for a public
portfolio. Never commit local environment files, production keys, real veterinary
records, invite links, or customer exports. A GitLab mirror should preserve
the license and commit history, and its CI should be configured separately
from GitHub Actions.
