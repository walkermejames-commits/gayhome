# Phase 4 initial integration audit

Date: 2026-08-02
Status: **Initial technical integration complete; independent review and production gates remain open.**

## Git integration

| Field | Result |
|---|---|
| Phase 2 baseline | `f254221091ec511396eb73f7071318556427651c` |
| Phase 3 source | `origin/codex/phase3-casework` |
| Phase 3 head | `316c2af7cc6c969d45b1cc9b866091e4d82192c2` |
| Integration branch | `codex/phase4-planning` |
| Merge base | `f254221091ec511396eb73f7071318556427651c` |
| Integration method | Fast-forward from the Phase 2 baseline to the Phase 3 head |
| Merge commit | None; the history was linear |
| Conflicts | None |
| Phase 3 files | 80 changed; 1,108 insertions; 15 deletions |
| Dropped or superseded files | None |
| Preserved local work | `.codex-tmp/`, `MASTER_BUILD_PROMPT.md`, and all Phase 4 planning files |
| Independent reviewer | Pending |

All remote branches and tags were fetched with pruning. Phase 3 was verified as a direct descendant of Phase 2. Untracked paths were compared with the Phase 3 tree before integration and no collision existed. No reset, rebase, force-push, shared-history rewrite, or destructive checkout occurred.

## Phase 3 implementation inventory

Phase 3 adds one primary migration and rollback, 17 case/advocate/consent API route files, casework data access, encryption-bound sensitive fields, PDF generation, 28 private workspace pages, access-controlled admin shells, synthetic PostgreSQL journeys, and a threat model. Evidence file bytes, external mail, real safeguarding referral, production retention jobs, and production infrastructure remain deliberately disabled or absent.

The App Router handlers use asynchronous `params`, authenticated cookie sessions, exact-origin checks for mutations, strict Zod request schemas, parameterised SQL, no-store responses, generic internal errors, and permission checks in the server data layer. The integrated build produced 43 static pages plus the expected dynamic pages and APIs.

## Migration audit

| Migration | Purpose | Result |
|---|---|---|
| `0001_phase1_foundation.sql` | Controlled public dataset foundation | Applied |
| `0002_phase2_runtime.sql` | PostgreSQL runtime, accounts, profiles, sessions, audit | Applied |
| `0003_phase3_casework.sql` | Cases, events, deadlines, evidence metadata, documents, advocates, consent, reviews, safeguarding and retention schema | Applied, rollback tested, reapplied |
| `0004_phase4_access_hardening.sql` | Preserve multiple invitation/consent-scoped grants for renewal and permission history | Applied, fail-safe rollback tested, reapplied |

The deployment proof now seeds the controlled Phase 2 dataset before applying Phase 3 and Phase 4 migrations, verifies service/council/revision counts survive, then validates current migration status. Empty-database apply, integration rollback/reapply, active dataset `v1.0.1`, canonical parity, idempotent import, conflict quarantine, 55-table logical backup, and restore pass.

The Phase 4 rollback refuses to restore Phase 3's uniqueness constraint when multiple grant-history rows exist; it does not delete or collapse permission history.

Managed-provider PITR, object-storage restore, key availability after restore, and a realistic hosted staging clone are not tested and remain under `DEPLOY-001`, `EVIDENCE-001`, and `AUTH-001`.

## API and permission audit

| Domain | Routes | Controls and current limits |
|---|---|---|
| Cases | `GET|POST /api/v1/cases`; `GET|PATCH /api/v1/cases/[caseId]` | Session, origin on mutations, validation, creation rate limit, owner/grant checks |
| Timeline and workflow | Events, deadlines, duties, applications, suitability, complaints, reviews | Per-action permission or owner checks; encrypted narrative fields; no external submission |
| Evidence | `POST /api/v1/cases/[caseId]/evidence` | Metadata only; file bytes remain blocked by `EVIDENCE-001` |
| Documents and export | Documents and export routes | Versioned encrypted drafts; explicit export permission; no-store PDF/JSON; `PDF-001` remains open/partial |
| Search | Case-scoped search | Owner only; encrypted narrative is excluded from the search index |
| Advocates | Invitation create/accept | Account email binding, hashed tokens, expiry, granular grants, creation rate limit, no mail delivery |
| Consent | Create and revoke | Owner-only creation, bounded purpose/actions, immediate linked invitation/grant revocation |

## Findings and fixes

| ID | Severity | Finding | Resolution and evidence |
|---|---|---|---|
| `INT-ACCESS-001` | High | `listCases` returned decrypted title/status data for any active grant, even when `view_summary` was absent. | Listing now requires an active `view_summary` permission and excludes archived cases. The Phase 4 PostgreSQL suite proves the title remains hidden while a separately granted `add_notes` action still works. |
| `INT-ACCESS-002` | High | Phase 3's unique case/grantee constraint made renewal or a later permission grant fail, despite the invitation model claiming renewal and history. | Migration `0004` permits distinct consent-scoped grant records. Listing uses `EXISTS`, preventing duplicate projections. Revocation remains consent-specific and immediate. |
| `INT-ACCESS-003` | High | Advocate access checks did not exclude archived cases. | Grant checks now join an unarchived case. Regression tests prove archived cases disappear from lists and direct access fails. |
| `INT-CASE-001` | High | Setting case status to `archived` did not set `archived_at`, so ordinary access checks continued treating the case as live. | The owner update transaction now records the archive timestamp; the regression suite archives through the real server function and proves owner and advocate projections fail closed. |
| `INT-API-001` | Medium | Invitation creation accepted an already-expired timestamp and stored an unusable consent/invitation. | The route now rejects non-future expiry with a generic validation error. |
| `INT-CI-001` | High | Phase 3's dedicated PostgreSQL persona suite was not executed by the quality workflow. | CI now runs `test:phase3` and `test:phase4:integration` sequentially after the deployment database proof. |

No finding is treated as independent penetration-test evidence. `PENTEST-001` remains open.

## Verification results

| Command | Result |
|---|---|
| `pnpm install --frozen-lockfile` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass |
| `pnpm test` | Pass: 7 files, 32 tests; jsdom emitted its known canvas notice |
| `pnpm exec vitest run tests/accessibility.test.tsx` | Pass: 4 automated axe cases; manual assistive-technology and lived-experience testing remain open |
| `pnpm audit:dataset` | Pass: 60 services, 13 councils, 12 routes, 12 scripts, 12 evidence categories, 73 sources; zero active unresolved references |
| `pnpm audit:source-history` | Pass as a historical reconciliation; the immutable original remains one source behind controlled revision `v1.0.1` |
| `pnpm audit --prod --audit-level high` | Pass: no known production vulnerabilities |
| `pnpm db:test:deploy` | Pass sequentially: four migrations, Phase 2-seeded upgrade, rollback/reapply, parity, backup and restore |
| `pnpm test:phase3` | Pass sequentially: 15 synthetic personas, 150 audit events, cross-user denial, revocation, no tested narrative log leak |
| `pnpm test:phase4:integration` | Pass: exact list permission, renewal/history, duplicate-safe projection, revocation and archive denial |
| `pnpm build` | Pass: integrated Next.js production build and route manifest |

Dataset integrity was reconfirmed without changing any controlled or immutable dataset file. Stable identifiers and council/triage relationships remain unchanged; all active service, council, and route references resolve; conflict records remain quarantined from the published catalog. The `v1.0.1` Samaritans repair remains intact: `srv_samaritans` resolves to `src_samaritans`, preserves the official transition provenance, and does not expose the retired email route to new users. The original 72-source revision remains unchanged and auditable, while the active controlled revision contains 73 sources.

The first attempt ran the build and two embedded PostgreSQL suites concurrently. Both database processes timed out under that contention. Each database suite passed when rerun sequentially, and CI now runs them as separate sequential steps.

## Remaining production blockers

- No hosted staging, pilot, or production environment or credentials.
- No independent penetration test.
- Evidence bytes, object storage, malware scanning, redaction, and secure downloads remain disabled.
- External mail and real notifications remain disabled.
- No approved production KMS/key-rotation exercise, provider PITR, or object restore.
- Manual WCAG 2.2 AA assistive-technology/browser/device testing and lived-experience testing remain incomplete.
- Governance, legal/content, retention, safeguarding ownership, staff training, service/council reverification, incident response, monitoring, and release approval remain incomplete.
- Full route-level HTTP adversarial testing and all 20 Phase 4 end-to-end journeys remain incomplete.

Accordingly, `PHASE3-INTEGRATION-001` is technically complete but not independently reviewed. This report does not authorise a pilot or production release.
