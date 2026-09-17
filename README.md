# Pawso

Pawso is an AI-powered pet-care copilot for managing veterinary records, medications, care routines, reminders, household collaboration, and grounded pet-specific questions.

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
npm install
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
```

```powershell
cd backend
.\.venv\Scripts\python.exe -m py_compile main.py ask_router.py
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
- [Backend deployment guide](docs/BACKEND_DEPLOYMENT.md)
- [Baseline Supabase schema](supabase/migrations/20260911_core_schema.sql)
- [Household sharing migration](supabase/migrations/20260912_household_shared_care.sql)
- [Household role permissions](supabase/migrations/20260912_household_role_permissions.sql)

## Current status

Pawso is a functional local MVP under active development. Review the audit and roadmap before external beta distribution.
