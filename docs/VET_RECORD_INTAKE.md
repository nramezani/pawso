# Clinic record intake

An owner can add a clinic name, veterinarian, phone, and email to a pet profile. From that profile the owner can share a one-time HTTPS link. A holder of the link can upload one PDF/JPEG/PNG/WebP file of at most 10 MB during the next seven days. The file is stored in the private `vet-records` bucket and appears in Medical Records as needing owner review. This does not authenticate the sender as a veterinarian and does not automatically add facts to the timeline or send a notification.

## Deployment order

1. Apply `supabase/migrations/20261001_vet_record_intake.sql` to the production project once, after all earlier migrations. Check that `vet_upload_links` exists and the `consume_vet_upload_link` function is executable by `service_role` only.
2. Deploy the backend with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `PAWSO_PUBLIC_API_URL=https://pawso.onrender.com`. Keep the service key server side.
3. Publish a fresh Expo update/build from the same commit, then test an owner-generated link from another device or browser. An already installed preview receives code changes only if its preview channel and runtime are configured for updates; otherwise build a new preview.

## Acceptance checks

- Owner creates a link, a browser opens the form, a clinic sends a real sample file, and the owner sees and opens it in Medical Records.
- The owner confirms only after checking the original; this confirms receipt and does not claim AI extraction or clinical verification.
- Reuse, expiry, malformed links, unsupported files, files over 10 MB, and non-owner creation all fail.
- Check that upload tokens never appear in application logs. Reverse proxy logging must also avoid retaining capability URLs.
- Delete the disposable document/pet and verify the private storage object and database rows are removed.

If storage fails after link consumption, the link is spent and the sender must request a fresh one. Direct clinic APIs, sender verification, email/push notification, and automated extraction of clinic submissions are future work.
