# Pawso Backend Deployment

The Pawso API is packaged as a provider-neutral Docker container. Any host that
accepts a Dockerfile and supplies HTTPS can run it, including Render, Railway,
Google Cloud Run, Azure Container Apps, and Fly.io.

Current production deployment: `https://pawso.onrender.com`

## Required secrets

Configure these as encrypted environment variables in the hosting dashboard.
Never add their real values to GitHub or a Docker image.

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Calls the OpenAI Responses API |
| `SUPABASE_URL` | Verifies Pawso user sessions |
| `SUPABASE_PUBLISHABLE_KEY` | Calls the Supabase Auth user endpoint |

Optional production configuration:

| Variable | Default |
| --- | --- |
| `CORS_ALLOWED_ORIGINS` | Local Expo web origins |
| `AI_REQUESTS_PER_MINUTE` | `10` |
| `AI_REQUESTS_PER_DAY` | `100` |
| `MAX_UPLOAD_SIZE_MB` | `10` |

The platform supplies `PORT`; the container defaults to `8000` when it is not
set.

## Deploy from GitHub

1. Create a web service on the chosen hosting provider.
2. Connect `nramezani/pawso` and select the `main` branch.
3. Select Dockerfile/container deployment with repository root as the context.
4. Add every required secret listed above.
5. Configure `/ready` as the readiness or health-check path.
6. Deploy and copy the generated HTTPS URL.
7. Verify both endpoints:
   - `https://YOUR-HOST/health`
   - `https://YOUR-HOST/ready`
8. Set the mobile environment variable to the host without a trailing slash:

   ```text
   EXPO_PUBLIC_API_URL=https://YOUR-HOST
   ```

9. Restart Expo with `npx expo start --clear`, then test Ask Pawso, Vet Visit
   Prep, Smart Care Plan, and veterinary-record extraction.

## Local container verification

From the repository root:

```powershell
docker build -t pawso-api .
docker run --rm -p 8000:8000 --env-file backend/.env pawso-api
```

Open `http://127.0.0.1:8000/ready`. It should return `status: ready`.

## Operations notes

- `/health` confirms the process is running and intentionally remains public.
- `/ready` confirms required configuration is present without revealing values.
- The current rate limiter is held in process memory. Run one API instance for
  the MVP. Move counters to Redis or Postgres before horizontal scaling.
- Use the hosting platform's log retention and alerting, but never log access
  tokens, uploaded documents, record contents, or OpenAI keys.
- Roll back by redeploying the previous successful Git commit.

## Verified Render deployment

- Provider: Render
- Source branch: `main`
- Runtime: repository-root Dockerfile
- Production URL: `https://pawso.onrender.com`
- Readiness path: `/ready`
- Initial production verification: health, readiness, authenticated Ask Pawso,
  Smart Care Plan, and Vet Visit Prep passed on September 16, 2026.
