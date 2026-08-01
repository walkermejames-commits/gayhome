# Phase 3 release gates

| Gate | State | Evidence or blocker |
|---|---|---|
| `CASE-001` | Closed for automated technical acceptance | Fifteen synthetic PostgreSQL journeys prove owner access, cross-user denial and audit. Independent review remains covered by `PENTEST-001`. |
| `EVIDENCE-001` | Open | Metadata is application-encrypted and file bytes are rejected. No approved object storage, KMS operation, malware scanner, metadata stripping, redaction or authorised delivery exists. |
| `SHARE-001` | Closed for automated technical acceptance | Email-bound expiring invite, granular permissions, limited advocate projection and immediate consent/grant revocation are exercised in all fifteen synthetic journeys. |
| `MAIL-001` | Open | No provider or OAuth integration. Copy/download preparation only. Runtime guard blocks premature activation. |
| `PDF-001` | Partially complete | Selectable text, headings, page numbers, date/reference, safe manifest and visual proof pass. PDF/UA tags, NVDA/VoiceOver and privacy-panel user tests remain. |
| `SAFEGUARD-001` | Awaiting human approval | Data model and restricted queue shell exist. Named operational owner, lawful basis, decision procedure and real referral integration are absent. |
| `RETENTION-001` | Partially complete | Retention/deletion schema and Phase 3 backup coverage exist. Approved schedules, legal-hold procedure and production worker are absent. |
| `PENTEST-001` | Open | No independent penetration test has occurred. Automated tests are not a substitute. |

Production evidence and mail flags default to false. Production configuration validation requires Phase 2 and Phase 3 approvals, HTTPS and non-test authentication.
