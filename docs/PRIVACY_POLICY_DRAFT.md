# Pawso Privacy Policy — Draft

**Status:** Product draft for legal review before public beta  
**Last updated:** September 21, 2026  
**Operator:** [Insert legal business name and mailing address]  
**Privacy contact:** [Insert monitored privacy email]

This draft is not legal advice. It must be reviewed for the jurisdictions where
Pawso will be offered before publication.

## 1. What Pawso does

Pawso helps people organize pet profiles, veterinary records, medications,
care routines, household collaboration, reminders, and AI-assisted summaries.
Pawso is not a veterinary clinic, emergency service, or substitute for a
licensed veterinarian.

## 2. Information we collect

Depending on the features used, Pawso may collect:

- Account details, such as email address, account identifiers, and authentication events.
- Pet details, including name, species, breed, age, sex, weight, microchip
  number, health conditions, allergies, medications, and veterinary clinic.
- Uploaded files and their extracted content, including veterinary records and images.
- Care information, including medication schedules, dose logs, tasks,
  completion history, symptoms, weights, and owner notes.
- Household information, including invitation codes, member names, roles, and
  records of who completed a care action.
- AI interactions, including questions, selected pet context, source record
  identifiers, generated answers, safety classifications, and technical usage metadata.
- Device and service information needed for security, diagnostics, notifications,
  fraud prevention, and reliable operation.

Do not upload information about another person unless you have authority to do so.
Avoid uploading unnecessary human medical, financial, government-ID, or payment information.

## 3. Why we use information

We use information to:

- Provide, synchronize, and secure Pawso.
- Display pet history and coordinate authorized household care.
- Extract, summarize, and answer questions about user-selected pet records.
- Schedule reminders and send service communications.
- Diagnose failures, prevent abuse, enforce limits, and improve safety.
- Comply with law and respond to valid legal requests.

We do not sell personal information. Pawso should not use private pet records or
AI prompts for advertising profiles.

## 4. AI processing and consent

When a user requests document extraction, Ask Pawso, Vet Visit Prep, or a Smart
Care Plan, selected pet information may be sent to an AI service provider for
that request. The product must show a clear consent notice before the first AI
submission and provide a non-AI path for manual record keeping.

AI output may be incomplete or incorrect. Users must review extracted fields
before confirmation and consult a veterinarian for medical decisions.

## 5. Service providers and international processing

Pawso currently relies on service providers such as Supabase for authentication,
database, and storage; Render for backend hosting; OpenAI for requested AI
processing; and Expo/EAS for application development and delivery. These
providers may process information outside Canada. Contracts, configuration,
access controls, and retention settings must be reviewed before beta.

## 6. Sharing

We disclose information only:

- To service providers acting for Pawso.
- To household members according to the role and access the owner authorizes.
- When a user intentionally exports or shares a report.
- When required by law, needed to protect safety or security, or involved in a
  properly disclosed business transfer.

Invitation codes must be treated as private credentials.

## 7. Retention and deletion

Pawso should retain information only while needed to provide the service, meet
legal obligations, resolve disputes, and maintain security. The production
retention schedule must define periods for active records, deleted accounts,
backups, logs, uploads, and AI request metadata.

Before beta, users must be able to delete documents, remove pet records, export
their data, and request account deletion. Deletion from active systems and the
backup-expiry timeline must be explained clearly.

## 8. Security

Pawso uses authentication, role-based database controls, private object storage,
signed file access, encrypted transport, backend authorization, and request
limits. No system is perfectly secure. Users should use a unique password,
protect devices and invite codes, and report suspected unauthorized access.

## 9. User choices and rights

Subject to applicable law, users may request access to, correction of, export
of, or deletion of their personal information and may withdraw optional consent.
Withdrawal may prevent features that require the relevant processing. Requests
should be sent to the privacy contact above, with identity verification limited
to what is reasonably necessary.

## 10. Children

Pawso is intended for adults who can agree to these terms. Do not create an
account for a child or submit a child's personal information without appropriate
legal authority and an approved child-privacy design.

## 11. Changes and complaints

Material changes should be communicated before taking effect when required.
Privacy questions or complaints should first be directed to Pawso's privacy
contact. Users may also contact the appropriate privacy regulator.

## Implementation checklist

- [ ] Confirm operator identity, privacy officer, address, and email.
- [ ] Complete data-flow and vendor-retention inventory.
- [ ] Add first-use AI consent with timestamp and policy version.
- [ ] Add export, document deletion, pet deletion, and account deletion.
- [ ] Define backup and log retention periods.
- [ ] Publish a stable HTTPS privacy-policy URL.
- [ ] Complete legal review for Canada, the United States, and launch regions.

## Reference foundation

This draft follows the Canadian fair-information principles of accountability,
identified purposes, consent, collection limitation, use/disclosure/retention
limitation, accuracy, safeguards, openness, individual access, and complaint
handling:

- https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/pipeda_brief/
- https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/
