# Pawso data governance and vendor register

Status: operational draft for private beta. Obtain Canadian privacy/legal review
before a public release and replace every item marked **confirm** with the
verified production setting.

## Data lifecycle

| Data | Primary store | Default lifecycle | User control |
| --- | --- | --- | --- |
| Account identity | Supabase Auth | Until account deletion | Password recovery, sign out, delete account |
| Pet profiles and photos | Supabase Postgres/Storage | Until pet or account deletion | Edit, archive, restore, permanent delete |
| Veterinary files and extracted fields | Supabase Storage/Postgres | Until document, pet, or account deletion | Download, archive, restore, permanent delete |
| Medication/care/health history | Supabase Postgres | Until pet or account deletion | Structured export; pet/account deletion |
| AI request content | Render → OpenAI | Transient application processing | Consent reset; delete source records/account |
| Invitation email | Render → Resend | Delivery processing | Revoke pending invite; remove member |
| Diagnostic events | Render logs | Fingerprint, platform, version only | No message, stack, pet name, email, or record body is accepted |
| Optional offline snapshot | Device app storage | Off by default; replaced as data changes; removed when disabled, on sign-out, or on account deletion | Account → Offline access |

Archived pets and documents remain in the primary database until restored or
permanently deleted. Archive is not deletion. The UI states this distinction.

Account deletion removes the Auth user and cascade-linked primary database
records after preventing accidental deletion of a household that still has
other members. Pawso also deletes veterinary-file and pet-photo objects. The
production service-role key is server-only.

Backups may retain deleted data for the provider's configured backup window.
Before launch, record the actual Supabase plan/window here and in the published
Privacy Policy: **confirm Supabase backup/PITR retention and deletion behavior**.
Do not promise an exact backup-erasure time until it is verified contractually.

## Export scope

The authenticated export endpoint returns JSON containing every structured row
the user can access under database RLS. It excludes secrets and binary file
bytes. Original veterinary files remain individually downloadable from Medical
Records. The export response uses `Cache-Control: no-store`.

## Vendor register

| Vendor | Purpose | Likely data | Required launch check |
| --- | --- | --- | --- |
| Supabase | Auth, Postgres, private files | Identity, pet/care/medical data | Region, DPA, backups, logs, security settings |
| Render | Pawso API | Auth token in transit; uploaded document in memory; API metadata | Region, DPA, log retention, service access |
| OpenAI API | Structured document extraction and grounded assistance | User-approved vet record or selected Pawso context | API data controls, DPA, retention setting, model policy |
| Resend | Household invitation email | Recipient email, household name, role, invite link | Domain verification, DPA, retention/log access |
| Expo/EAS | Builds, updates, push infrastructure if later enabled | Build metadata; update/device metadata | Organization access, 2FA, update signing, DPA |
| Apple / Google | Store distribution and optional billing later | Store account/device/purchase metadata | Privacy forms, agreements, account security |
| GitHub | Source and CI | Source code and CI metadata; no production secrets | Branch protection, 2FA, secret scanning |

## Access and security rules

- Owner: full pet/medical administration, member/role management, export and deletion.
- Caregiver: view medical records and manage/log care; cannot change owner-only medical setup.
- Sitter: day-to-day care and medication instructions only; medical documents and AI medical tools remain hidden.
- Production API mutations require a Supabase bearer token.
- RLS and security-definer RPCs enforce household access; direct access to rate-limit counters is revoked.
- Secrets belong in Render/EAS secret stores, never Git or `EXPO_PUBLIC_*` variables.
- Rotate exposed/reused credentials immediately and review access quarterly.

## Review cadence

- Quarterly: vendor access, retention settings, service accounts, support access.
- Each release: privacy data map, permission changes, new SDK/vendor review.
- After an incident: preserve a privacy-safe timeline, rotate affected keys,
  notify the owner/legal advisor, and evaluate notification duties.
