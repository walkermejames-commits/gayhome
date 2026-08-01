# Phase 1 remediation and Phase 2 implementation report

Date: 2026-08-01. This report distinguishes implemented code from verified acceptance evidence. It does not describe staging as a public launch.

## Repository changes

Database/runtime: `.env.example`, `Dockerfile`, `.dockerignore`, `pnpm-workspace.yaml`, `package.json`, `pnpm-lock.yaml`, `migrations/0002_phase2_runtime.sql`, `scripts/migrate.mjs`, `scripts/migration-status.mjs`, `scripts/seed-postgres.ts`, `scripts/test-postgres-deploy.ts`, `scripts/release-gates.mjs`, `scripts/lib/database.mjs`, `scripts/lib/logical-backup.mjs`, `src/server/env.ts`, `src/server/catalog.ts`, `src/server/db/{pool,identifiers,seed-catalog}.ts`, `src/server/repository/{types,index,file-catalog-repository,postgres-catalog-repository}.ts`, `src/db/schema.ts`, and `src/app/api/v1/health/route.ts`.

Authentication/security: `src/server/auth.ts`, `src/server/auth-cookie.ts`, `src/server/security/encryption.ts`, auth/session/account API routes, `tests/encryption.test.ts`, and the revised accessibility test.

Public experience: revised layout, home, privacy and styles; added required application, triage, plan, council, service, profile, letter, evidence, case, advocate, accessibility and discreet-mode routes; added the corresponding client components. `/profile-demo` and its public demonstration component were removed.

Operations/governance: `.github/workflows/quality.yml`, `docs/deployment/POSTGRES_BACKUP_RESTORE.md`, `docs/governance/GOVERNANCE_PACK_DRAFT.md`, and `docs/accessibility/MANUAL_TEST_PLAN.md`.

## Database

Both `0001_phase1_foundation.sql` and `0002_phase2_runtime.sql` apply on a real isolated PostgreSQL 18 cluster. Active revision is `v1.0.1`. Verified counts are services 60, councils 13, triage routes 12, scripts 12, evidence categories 12 and sources 73. JSON-to-PostgreSQL canonical parity is exact; stable IDs, source references and route targets pass integrity validation. The temporal public-contact filter continues to hide retired/unavailable/new-user-ineligible channels, including the retired Samaritans email.

Repeated import returns `idempotent`. A controlled same-version/different-hash import returns `review_required` with one reconciliation item. A 29-table logical backup was taken after inserting a synthetic profile, service and profile rows were deleted, and the backup restored both counts and the profile. Evidence: `artifacts/phase2/deploy-001-restore-report.json`.

## Release gates

| Gate | State | Evidence / remaining work |
|---|---|---|
| DATA-001 | Closed historically | `v1.0.1` remains active; immutable source hashes and canonical parity reverified. |
| DEPLOY-001 | Closed for code and test acceptance | Real PostgreSQL migration/import/runtime repository/health/idempotency/conflict/backup/restore proof passes. Staging deployment is a separate external action awaiting credentials. |
| AUTH-001 | Partially complete; persistent private UI remains disabled | AES-256-GCM with context binding, passwordless token lifecycle, rate limits, rotation, revocation, export/deletion APIs and secure cookies are implemented. An approved email-delivery adapter, complete profile/consent persistence APIs, deletion worker, key-vault operation and full adversarial integration suite remain. |
| ACCESS-001 | Open | Automated axe coverage passes. Required NVDA, VoiceOver/Safari, supported-device, zoom/reflow manual sign-off and lived-experience sessions have not occurred. |
| GOV-001 | Awaiting human approval | Draft governance pack exists. Named accountable owners, legal/DPO decisions and all authorised signatures remain required. |

Production guards require all four approval variables and secure configuration; production remains blocked.

## APIs

Existing controlled APIs remain: services collection/item, councils collection/item, deterministic triage, dataset revision and device session. Added: `GET /api/v1/health`; `POST /api/v1/auth/request-link`; `POST /api/v1/auth/consume-link`; `GET|DELETE /api/v1/auth/session`; `GET /api/v1/account/export`; `POST /api/v1/account/delete`.

## Pages

Implemented routes: `/`, `/help-now`, `/triage`, `/my-plan`, `/apply`, all seven `/apply/[flow]` variants including required homelessness/emergency paths, `/support`, `/support/[id]`, `/councils`, `/councils/[id]`, `/profile` and the three required profile sections, `/letters`, `/letters/[id]`, `/evidence`, `/case`, `/help-someone`, `/privacy`, `/accessibility`, and `/discreet-mode`.

The pages are a coherent text-first public application and use database repository content. Limitations: postcode/current-location resolution is not connected to an approved authoritative geocoder; plans are intentionally session-only and reminders/sharing are not externally integrated; application copy/PDF hand-offs are local only; account-backed case/profile saving is not exposed while `AUTH-001` is open.

## Autofill and reviewed hand-off

Seven initial flows are selectable. Each asks missing questions, makes values editable, requires an explicit review checkbox and offers local print/PDF or copy without direct submission. Sensitive identity is not inserted automatically. The existing domain autofill layer retains missing/stale/sensitive/removable behaviour and field provenance. The Phase 2 UI does not yet connect encrypted account facts to every flow, so this remains an implementation limitation under `AUTH-001`.

## Security

Authentication tokens are random, stored as keyed hashes, expire after 15 minutes and are one-use. Responses are enumeration-resistant. Requests are same-origin checked and rate limited. Sessions use HttpOnly, SameSite cookies, rotate on sign-in, expire and support current/all-device revocation. Sensitive encryption uses Node's authenticated AES-256-GCM with key IDs and additional authenticated context; plaintext is not logged. Account export and delayed deletion request APIs require a live session. CSP and other response headers remain. Production dependency audit reports no known vulnerabilities.

Security gaps: no approved email provider or recovery/change-email delivery; no external secrets manager proof; incomplete cross-user/CSRF/auth integration suite; no background deletion completion report. Therefore `AUTH-001` is not closed.

## Accessibility

Automated tests: axe component check passes with the full unit suite. Keyboard-oriented semantics, skip link, focus styles, 44px controls, reduced motion and print styles are implemented. Manual and device results do not exist; see the open test plan. No signed accessibility report exists, so `ACCESS-001` remains open.

## Deployment

Staging address: **not deployed — external platform credentials and a provisioned hosted PostgreSQL database were not available in this environment.** The repository contains a standalone container, validated environment contract, database commands, limited health endpoint, noindex metadata, CSP, secret/content guards and CI. Dataset target is `v1.0.1`. Production is blocked by `release:check` unless configuration and authorised gate approvals exist.

## Verification commands and results

- `pnpm typecheck`: pass.
- `pnpm lint`: pass.
- `pnpm test`: 6 files, 25 tests passed (jsdom reports its known canvas-not-implemented notice from axe).
- `pnpm audit:dataset`: pass; exact controlled counts and zero unresolved references.
- `pnpm import:datasets`: pass; JSON/workbook parity and idempotency.
- `pnpm db:test:deploy`: pass; real PostgreSQL migration, runtime parity, health, import conflict and restore proof.
- `pnpm build`: pass; 34 application/API routes produced.
- `pnpm audit --prod --audit-level high`: no known vulnerabilities.

## Known limitations and blockers

External staging credentials are missing. Human accessibility tests and governance approvals cannot be manufactured by code. Approved transactional email, secrets/key-vault operation, provider PITR rehearsal, authoritative postcode/geolocation mapping, persistent consent/profile endpoints, background account deletion, encrypted object storage, complete 15-scenario E2E coverage and moderated lived-experience testing remain. Persistent private data and evidence upload stay disabled; public launch remains prohibited.
