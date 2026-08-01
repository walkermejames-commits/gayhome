# Phase 0 privacy, safeguarding and security risk register

Ratings are initial design ratings and must be reassessed through the DPIA, safeguarding review and threat-modelling workshops.

| ID | Risk | Initial severity | Required treatment / release gate |
|---|---|---:|---|
| DATA-001 | A live service has no resolving provenance source | Critical | Block publication; authorised reviewer adds or corrects an evidenced source in both formats; rerun reconciliation |
| SAFE-001 | Wrong route order delays emergency or child safeguarding help | Critical | Deterministic priority rules, invariant tests, approved fallbacks, no AI override, clinical/safeguarding review |
| SAFE-002 | Stale phone, hours or eligibility data leaves a person without help | Critical | Human verification intervals, prominent last-checked state, fallback route, correction reports, emergency publication process |
| SAFE-003 | Guidance is mistaken for guaranteed legal eligibility or accommodation | High | Plain limitations, fact-specific prompts, specialist escalation, versioned legal review, never promise outcomes |
| PRIV-001 | Notifications or shared-device traces expose LGBTQIA+ identity, abuse or location | Critical | Neutral copy/icon/title, protected previews, safe-contact policy, session-only mode, quick exit with honest limitations |
| PRIV-002 | Over-collection or secondary use of sexuality, gender history, health, abuse or immigration data | Critical | Data minimisation, explicit purposes, Article 6/9 analysis, field sensitivity policy, retention/deletion controls, DPIA |
| PRIV-003 | Advocate or service editor accesses a private case without valid authority | Critical | Case-scoped ABAC, time-bound delegation, recipient-specific consent, admin/user data-plane separation, immutable audit |
| PRIV-004 | AI provider receives identifiable full case data | Critical | Off by default, minimisation/redaction, separate consent, contractual assessment, no training use, deterministic facts authoritative |
| SEC-001 | Account takeover exposes evidence and safe-contact information | Critical | Passwordless/phishing-resistant options, MFA for privileged roles, session controls, anomaly detection, recovery safeguards |
| SEC-002 | Malicious upload compromises staff or infrastructure | High | Quarantine, type/signature validation, malware scan, sandboxed processing, encrypted object storage, safe rendering |
| SEC-003 | Import formula injection, external links or malicious workbook content | High | Never evaluate imported formulas as trusted content, reject macros/external links, escape exports, schema allowlist |
| SEC-004 | Logs, analytics, backups or support tools leak sensitive facts | Critical | Field-level log denylist, privacy-preserving analytics, encrypted backups, access review, restore environment controls |
| SEC-005 | Dataset publication partially succeeds or rollback loses history | High | Transactional immutable revisions, active-pointer switch, checksums, tested rollback and restore |
| FAIR-001 | Matching excludes people because of missing identity disclosure or proxy bias | High | Identity never required for statutory help, explain ranking, user-controlled filters, fairness/persona testing, override path |
| ACCESS-001 | A crisis flow is unusable by screen-reader, keyboard, Deaf or cognitively overloaded users | Critical | WCAG 2.2 AA, manual assistive-technology testing, text channels, simple mode, no crisis timeout, one principal action |
| OPS-001 | Automated URL success is treated as proof a service is operational | High | Human verification evidence and status remain required; automation only creates verification tasks |
| OPS-002 | Support-worker access persists after consent ends | Critical | Expiring grants, instant revocation, per-action checks, user-visible access history and alerts using safe channels |

## Legal and governance assumptions requiring counsel/controller sign-off

- Sexual orientation and health information are special-category data. The controller must document both an Article 6 lawful basis and an Article 9 condition before processing; ICO guidance also notes that some Schedule 1 conditions require an appropriate policy document: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/special-category-data/.
- A DPIA is a pre-processing release gate because the design combines innovative technology, vulnerable people, special-category data, profiling/matching and potentially high-impact decisions. ICO guidance treats likely high-risk processing as requiring a DPIA: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-impact-assessments/.
- Homelessness guidance and generated scripts require controlled legal-content review against the current statutory guidance; the application must not decide eligibility or tell a person to abandon a statutory route.
- Children, domestic abuse, immigration, criminal-offence data and advocate access each need separate safeguarding/data-governance decisions, retention rules and incident playbooks.

This register is not legal advice and does not replace a DPIA, safeguarding assessment, penetration test or independent legal review.
