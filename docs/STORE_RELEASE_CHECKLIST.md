# Pawso App Store and Play release checklist

## Accounts and naming

- [ ] Rename the Expo project from `pawso-temp` to `pawso` in the Expo dashboard.
- [ ] After the dashboard rename, change the local Expo slug to `pawso` and run `eas project:info`.
- [ ] Confirm Apple Developer and Google Play Console legal entities, tax, banking, agreements, and 2FA.
- [ ] Reserve the app name and confirm bundle IDs: `com.narara.pawso` on both platforms.
- [ ] Use unique, incrementing iOS build numbers and Android version codes.

## Public URLs and legal

- [ ] Have Canadian privacy/legal counsel review the Privacy Policy and Terms drafts.
- [ ] Publish privacy, terms, and support pages over HTTPS.
- [ ] Configure their EAS public variables for `production` and rebuild.
- [ ] Document data retention, account/pet/document deletion, AI vendors, and contact details consistently.
- [ ] Complete Apple App Privacy and Google Play Data Safety answers from the verified vendor/data map.

## Store content

- [ ] Final app name, subtitle/short description, full description, keywords, category, copyright.
- [ ] App icon and adaptive/monochrome icons verified on real devices.
- [ ] Phone screenshots for required iOS/Android sizes; tablet screenshots only if tablet support remains enabled.
- [ ] Screenshots contain demo data only—no real email, pet medical data, invite codes, or notifications.
- [ ] Support URL, Privacy URL, marketing URL if used, review notes, and emergency/medical disclaimer.
- [ ] Explain anonymous onboarding, account security, AI record review, household sharing, and in-app account deletion to reviewers.

## Release build

- [ ] All P0 external checks in `EXTERNAL_COMPLETION_CHECKLIST.md` pass.
- [ ] `npx eas-cli@latest build --platform all --profile production` succeeds from a clean `main`.
- [ ] Install store-signed builds through TestFlight and Play internal testing—not Expo Go.
- [ ] Test fresh install, upgrade, relaunch, offline read-only, recovery, invite, notification, export, archive/restore/delete, and account deletion.
- [ ] Test accessibility with VoiceOver/TalkBack, large text, reduced motion, and dark mode.
- [ ] Confirm crash/ready monitoring and support inbox before staged rollout.
- [ ] Start with a small staged release; monitor errors/support and pause rollout if account, RLS, deletion, or data-loss issues appear.

## Membership decision

Keep the beta free. Pawso does not yet implement paid entitlements or store
receipt validation. Add subscriptions only after retention and shared-care
usage justify them; then use Apple/Google in-app purchase rules, a server-owned
entitlement ledger, restore purchases, renewal/refund webhooks, and a tested
downgrade policy that never blocks export/deletion or deletes existing data.

