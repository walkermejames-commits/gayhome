# Phase 4 integration audit template

Status: **Reusable template — the initial completed record is in `PHASE4_INTEGRATION_AUDIT.md`.**

This template must be completed from the actual Phase 3 implementation. Planned Phase 3 paths or features are not evidence.

## 1. Git audit

| Field | Recorded value |
|---|---|
| Phase 2 baseline commit | `f254221091ec511396eb73f7071318556427651c` |
| Phase 3 source ref | Pending |
| Phase 3 head commit | Pending |
| Phase 4 integration branch | Pending |
| Merge base | Pending |
| Integration method and reason | Pending |
| Merge commit | Pending |
| Reviewer | Pending |

### Conflict record

| File | Conflict cause | Phase 2 content preserved | Phase 3 content preserved | Resolution | Reviewer |
|---|---|---|---|---|---|
| Pending | Pending | Pending | Pending | Pending | Pending |

Record every removed, dropped, renamed, generated, duplicate-looking, or superseded file. Do not remove migrations until their purpose, ordering, data-preservation effect, and rollback implications are understood.

## 2. Repository inventory

Record added, changed, removed, and generated files. Classify each by database, API, UI, security, evidence, consent, documents, administration, infrastructure, tests, or documentation. Record the reason for every removal.

## 3. Schema and migration audit

For each migration record its identifier, checksum, dependencies, tables, columns, indexes, foreign keys, delete behaviour, retention behaviour, rollback approach, and reviewer.

Verify and attach evidence for:

- Unique and ordered migration identifiers.
- Preservation of the Phase 2 dataset and user data.
- User and case ownership boundaries.
- Advocate, professional, administrator, and safeguarding access boundaries.
- Consent linkage, expiry, revocation, and permission history.
- Evidence metadata, object references, hashes, scan state, retention, and deletion.
- Immutable or appropriately protected audit records.
- Indexes for ownership, deadlines, timelines, access checks, and retention jobs.
- Empty-database migration, Phase 2-seeded migration, and synthetic staging-clone migration.
- Backup before migration and verified restore after migration.

| Environment | Starting state | Command | Result | Evidence | Reviewer |
|---|---|---|---|---|---|
| Empty test database | Pending | Pending | Pending | Pending | Pending |
| Phase 2 seeded | Pending | Pending | Pending | Pending | Pending |
| Synthetic staging clone | Pending | Pending | Pending | Pending | Pending |

## 4. API and authorisation audit

Inventory every added or changed route with method, authentication, resource owner, allowed roles, consent requirements, validation schema, rate limit, audit event, error behaviour, and tests.

For each object-bearing route test owner access, different-user denial, unassigned-professional denial, expired-grant denial, revoked-consent denial, suspended-role denial, administrator limits, identifier guessing, and concurrent revocation. Check that errors and logs disclose no sensitive facts.

| Method and route | Owner/roles | Consent | Validation | Rate limit | Audit event | Negative tests | Result |
|---|---|---|---|---|---|---|---|
| Pending | Pending | Pending | Pending | Pending | Pending | Pending | Pending |

## 5. Phase 3 domain verification

For each domain, record actual files, schema, APIs, UI routes, automated tests, manual tests, security findings, accessibility findings, and release gate.

| Domain | Implemented evidence | Missing or unsafe behaviour | Gate | Reviewer |
|---|---|---|---|---|
| Cases and dashboard | Pending | Pending | `CASE-001` | Pending |
| Timeline and deadlines | Pending | Pending | `CASE-001` | Pending |
| Evidence and object storage | Pending | Pending | `EVIDENCE-001` | Pending |
| Generated documents and PDF | Pending | Pending | `PDF-001` | Pending |
| Advocates and professional access | Pending | Pending | `SHARE-001` | Pending |
| Consent and revocation | Pending | Pending | `SHARE-001` | Pending |
| Suitability, complaints, and reviews | Pending | Pending | `CASE-001` | Pending |
| Safeguarding | Pending | Pending | `SAFEGUARD-001` | Pending |
| Administration | Pending | Pending | `AUTH-001` | Pending |
| Retention and deletion | Pending | Pending | `RETENTION-001` | Pending |

## 6. UI and accessibility audit

Inventory every added or changed route. Verify navigation, loading, empty and error states, mobile layout, keyboard access, screen-reader names, focus handling, 200% and 400% zoom, reflow, high contrast, reduced motion, text spacing, touch targets, safe exit, discreet mode, guest/public-device behaviour, print, and accessible upload alternatives.

Manual evidence must distinguish untested from passed. Automated axe results do not close `ACCESS-001`.

## 7. Security audit

Verify actual behaviour for authentication, sessions, ownership, consent, uploads, downloads, object storage, encryption, key versions, email, PDF, exports, deletion, backups, logs, scheduled jobs, privileged access, break-glass access, dependencies, CI, and secrets.

Test at minimum: IDOR, broken access control, privilege escalation, cross-user disclosure, revoked or expired access reuse, CSRF, XSS, SQL and command injection, path traversal, unsafe filenames, MIME confusion, malware and oversized uploads, PDF/email injection, cache leakage, replay, races, rate-limit bypass, account enumeration, redirects, OAuth callbacks, log leakage, and backup leakage.

| Finding | Severity | Affected control | Reproduction | Fix commit | Retest | Risk owner |
|---|---|---|---|---|---|---|
| Pending | Pending | Pending | Pending | Pending | Pending | Pending |

## 8. Regression and journey evidence

Run the full Phase 2 suite before and after integration. Add Phase 3 unit, integration, database, browser, security, accessibility, retention, backup/restore, and concurrency tests. Record exact commands and unedited result summaries.

Exercise all 20 required Phase 4 personas and record triage, council, service, profile, autofill, case, timeline, deadline, evidence, documents, consent, sharing, revocation, export, deletion, safe exit, discreet mode, accessibility, audit, cross-user denial, and error recovery.

## 9. Integration conclusion

State whether the integration is safe to proceed to hardening. List every open defect, gate, human approval, external credential, operational dependency, and accepted risk. A green automated build is not sufficient evidence for release.
