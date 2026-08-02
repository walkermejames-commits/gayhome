# Phase 4 release-readiness plan

Status: **Phase 3 integrated — hardening and independent review in progress.**

The real Phase 3 source was integrated on 2026-08-02. Initial migration, API, and access-control audit evidence is recorded in `PHASE4_INTEGRATION_AUDIT.md`; the remaining workstreams and human approvals continue to block production.

## Sequenced work

| Order | Workstream | Entry condition | Exit evidence | Blocking gate |
|---|---|---|---|---|
| 1 | Phase 3 discovery and safe integration | Immutable Phase 3 ref exists | Completed integration audit and reviewed merge | `PHASE3-INTEGRATION-001` |
| 2 | Schema, API, ownership, consent, evidence, and casework audit | Integrated source available | Migration matrices, API inventory, negative authorisation tests | `CASE-001`, `EVIDENCE-001`, `SHARE-001` |
| 3 | Full regression and required journeys | Audit scope established | Exact test results and defect register | All affected technical gates |
| 4 | Security, encryption, storage, email, PDF, retention, and penetration-test preparation | Integrated architecture verified | Threat report, adversarial tests, key-rotation proof, storage/email/PDF reviews | `AUTH-001`, `EVIDENCE-001`, `MAIL-001`, `PDF-001`, `RETENTION-001`, `PENTEST-001` |
| 5 | Environment separation, monitoring, backup, restore, and release guards | Providers and credentials approved | Staging evidence, recent restore, alert tests, fail-closed CI | `DEPLOY-001` |
| 6 | Accessibility and lived-experience testing | Stable integrated pilot candidate | Manual assistive-technology evidence, compensated research report, retests | `ACCESS-001` |
| 7 | Legal content, service, council, governance, privacy, and safeguarding review | Stable content and data candidate | Approved controlled revision and named human sign-offs | `DATA-001`, `GOV-001`, `SAFEGUARD-001` |
| 8 | Controlled pilot | All critical pre-pilot checks pass | Pilot report, incident review, rollback exercise | All critical gates |
| 9 | Staged release decision | Pilot exit criteria met | Named approver, version, revision, rollback version, support cover | All production-blocking gates |

## Environment and operations design decisions to approve

Before implementation, record named owners and approved providers for isolated staging, pilot, and production databases; object storage; authentication tenants; email credentials; secrets; encryption keys; logs; metrics; backups; restore environment; DNS; and TLS. No environment may share these resources with another environment.

The production environment contract must fail closed for missing values, development secrets, insecure cookies, localhost callbacks, unapproved dataset revisions, or open critical gates. It must never print secret values.

## Release guard checks to encode after integration

The deployment guard must verify the approved dataset revision and audit; migration currency; recent backup and restore test; security and dependency scans; accessibility and governance status; safeguarding and incident owners; penetration-test findings; object-storage controls; approved email integration; and published legal/privacy documents. Critical failure blocks deployment.

The guard must use reviewed evidence with dates and owners, not self-asserted environment variables alone. Human-governance gates remain human decisions.

## Human and external work that automation cannot complete

- Named controller/DPO, safeguarding, accessibility, editorial, security, incident, service-verification, recovery, and release owners.
- Independent penetration test and disposition of findings.
- Manual WCAG 2.2 AA testing on the required assistive technologies and browsers.
- Compensated, trauma-informed lived-experience testing with diverse participants.
- Legal and content review for England, Kent, and Medway.
- Primary-source reverification of every council and service record through a controlled dataset revision.
- DPIA, ROPA, lawful-basis, special-category, retention, processor, transfer, cookie/storage, AI, editorial, complaints, and safeguarding approvals.
- Provider-native backup/PITR and object-storage restore exercises.
- Staff training and role approval.

## Pilot and rollout stages

| Stage | Users and data | Integrations | Minimum entry criteria | Exit and rollback |
|---|---|---|---|---|
| 1. Internal | Authorised staff; synthetic data only | Disabled or sandboxed | Integrated test environment and named incident owner | Critical defects fixed; rollback exercised |
| 2. Closed lived-experience | Consented participants; synthetic scenarios | Minimum required | Accessibility plan, support, consent, compensation, safeguarding owner | Findings triaged and high-risk defects resolved |
| 3. Partner pilot | Small approved partner group; synthetic or carefully consented data | Approved limited providers | Pen test scheduled/completed as risk requires; monitoring and daily review | Critical issues resolved; workload and trust acceptable |
| 4. Limited public beta | Kent and Medway cohort | Individually approved | All production-blocking gates closed or formally accepted by authorised owners | Stable operation and rehearsed rollback |
| 5. Public release | Approved public scope | Approved only | Named release approval, support cover, active revision and rollback version | Ongoing monitoring, verification, and incident review |

No stage automatically authorises the next.

## Required operational artifacts

Before a pilot, prepare architecture and API inventories; synthetic role accounts; penetration-test scope; alert matrix; incident runbooks; backup and recovery runbook with RTO/RPO; retention/deletion test report; service/council verification report; accessibility report; lived-experience report; staff training records; pilot support process; rollback runbook; release notes; and the completed Phase 4 report.
