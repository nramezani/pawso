# Pawso EAS Environment Setup

Pawso needs three public runtime values in every EAS environment. A local
`.env.local` file is not automatically available to a cloud build.

Configure these values in the Expo dashboard for **development**, **preview**,
and **production**:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_API_URL` (the deployed HTTPS API, currently the Render service)

Before a public beta, also configure:

- `EXPO_PUBLIC_PRIVACY_POLICY_URL`
- `EXPO_PUBLIC_TERMS_OF_USE_URL`

Use **Plain text** visibility for `EXPO_PUBLIC_*` values because Expo embeds them
in the client application. Never put the Supabase service-role key, OpenAI key,
or Resend key in an `EXPO_PUBLIC_*` variable.

After saving the values, create a new native build. Existing APK/IPA binaries do
not gain build-time environment variables retroactively. Confirm the selected
environment in the EAS build log, install the new build, and verify that Pawso
opens without a configuration warning.
