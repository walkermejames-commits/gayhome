# Phase 1 completion report

Date: 2026-08-01
Dataset revision: `v1.0.1`
Parent dataset: `v1`
Release gate: `DATA-001` resolved and retained in history

## Outcome

The authorised Samaritans repair was applied to controlled copies only. The immutable Phase 0 evidence files remain byte-for-byte unchanged. The complete revised-dataset audit passed before application work began.

The Phase 1 foundation is implemented and passes its automated acceptance gates at code level: both source formats import to the same canonical records, imports are idempotent, conflicts require review, invalid references are quarantined, APIs expose controlled content, deterministic triage resolves targets, and the profile/consent/autofill/session foundations are tested.

## Controlled revision

- `data/revisions/v1.0.1/kent_lgbtq_homelessness_resource_seed.json`
- `data/revisions/v1.0.1/Kent_LGBTQ_Homelessness_Resource_Database_v1.0.1.xlsx`
- `data/revisions/v1.0.1/revision-manifest.json`
- `data/revisions/v1.0.1/REVISION.md`

Original SHA-256 values remain:

- JSON: `D41B7056CBA08EDC8951C5360F33054CD0FF3A9FBDCAE4F0425BA0889A155311`
- workbook: `B8F921BB33F326CB167A55EBAA32A8621DE4D5F94C166ABDA955E182E35BB54F`

Revision SHA-256 values are:

- JSON: `4AFD1FE19A761AB254D150DFD921C6A23786D80921A219103F7617261CEACBD7`
- workbook: `211F71DF84C2007CD31E421469ADEBA314223557CC514CF34AAC82628B929BE6`

Exactly one source record, `src_samaritans`, was added. Exactly one dependent service record, `srv_samaritans`, was updated. No other service, council, triage, script, evidence or source content changed, and all stable identifiers were preserved.

The revised audit reports 60 services, 13 councils, 12 triage routes, 12 scripts, 12 evidence records and 73 sources, with no duplicates, unresolved references, unresolved targets or mutually represented field differences. The JSON-only `triage_routes.verified_on` value remains `2026-07-31` and is supplied to workbook import through the controlled manifest sidecar rather than inferred.

Audit evidence:

- `artifacts/v1.0.1/audit/reconciliation-report.json`
- `artifacts/v1.0.1/audit/authorized-change-report.json`
- `artifacts/v1.0.1/audit/workbook-structure-report.json`

All eight sheets are visible and rendered successfully. Formulas, validation counts, filters, table count, merges and sheet order are unchanged. The revised workbook has one additional cell style associated with the authorised wrapped source note; no critical structural difference was detected.

## Files changed or added

Repository and configuration:

- `.env.example`
- `.gitignore`
- `README.md`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `tsconfig.json`
- `next-env.d.ts`
- `next.config.ts`
- `eslint.config.mjs`
- `vitest.config.ts`
- `drizzle.config.ts`

Data repair and audit:

- `data/revisions/v1.0.1/*`
- `artifacts/v1.0.1/audit/*`
- `scripts/apply-data-repair.mjs`
- `scripts/audit-revision.mjs`
- `scripts/import-datasets.ts`
- `scripts/reconcile-phase0.mjs`
- `scripts/verify-xlsx-structure.ps1`
- `docs/phase-0/DATASET_AUDIT.md`
- `docs/phase-0/FOUNDATION.md`
- `docs/phase-0/RISK_REGISTER.md`

Application foundation:

- `src/db/schema.ts`
- `src/domain/catalog.ts`
- `src/domain/import/integrity.ts`
- `src/domain/import/json-importer.ts`
- `src/domain/import/reconciliation.ts`
- `src/domain/import/revision-store.ts`
- `src/domain/import/workbook-importer.ts`
- `src/domain/verification.ts`
- `src/domain/triage.ts`
- `src/domain/profile.ts`
- `src/domain/autofill.ts`
- `src/content/test-form.json`
- `src/server/catalog.ts`
- `src/server/http.ts`
- `src/proxy.ts`
- `src/app/**/*`
- `src/components/fast-apply-demo.tsx`
- `src/components/safe-exit-button.tsx`

Tests:

- `tests/dataset-import.test.ts`
- `tests/triage.test.ts`
- `tests/autofill.test.ts`
- `tests/security-foundation.test.ts`
- `tests/accessibility.test.tsx`

## Migration added

- `migrations/0001_phase1_foundation.sql`

It creates immutable dataset imports/revisions, source verification, services, service tags, temporal contact channels, councils, triage routes, profile facts, field definitions, consent receipts, form contracts, autofill mappings, sessions and audit events. `src/db/schema.ts` is the typed Drizzle representation.

## Commands

```powershell
pnpm install
pnpm audit:dataset
pnpm import:datasets
pnpm db:migrate
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm audit --prod
```

`pnpm db:migrate` requires a configured `DATABASE_URL`; it was not executed against an external database in this local workspace.

## API routes

- `GET /api/v1/services`
- `GET /api/v1/services/[id]`
- `GET /api/v1/councils`
- `GET /api/v1/councils/[id]`
- `POST /api/v1/triage`
- `GET /api/v1/dataset/revision`
- `GET|POST|DELETE /api/v1/session`

Runtime smoke tests returned HTTP 200 for the application screens and read APIs. Triage resolved `homeless tonight` plus `Canterbury` to `route_02`, the Canterbury council and its ordered service targets. Session mutation rejected an untrusted origin with 403 and accepted `private_device` from the same origin with HttpOnly, SameSite cookies.

## Test results

- `pnpm typecheck`: passed with strict TypeScript checks.
- `pnpm lint`: passed.
- `pnpm test`: 5 files and 23 tests passed.
- `pnpm build`: passed; 11 application/API routes generated.
- `pnpm peers check`: no peer dependency issues.
- `pnpm audit --prod`: no known vulnerabilities after controlled PostCSS and Sharp overrides.
- `pnpm audit:dataset`: passed with 73 sources and zero unresolved references.
- Workbook structure verification: passed.
- Accessibility: automated axe test passed; interaction test confirms prefill values can be edited/removed and review remains mandatory.
- Browser visual automation could not connect in this desktop runtime. HTTP rendering, build output, component tests and axe checks passed; a manual cross-browser and assistive-technology pass remains a pre-release gate.

## Security decisions

- Every external payload and both dataset formats are validated with Zod before publication.
- Invalid or unresolved records are rejected; conflicting revisions create review items and cannot publish without explicit approval.
- Mutating session requests enforce same-origin checks and size-bounded triage input.
- Session cookies are HttpOnly, SameSite Lax and Secure in production.
- Responses use no-store where user/session state may be involved.
- A request nonce drives a strict CSP; baseline headers deny framing, MIME sniffing and unnecessary device permissions.
- Presentation code contains no unsafe HTML/code execution sinks and no hard-coded operational phone or email details.
- Public contacts respect temporal status, validity windows, intended audience, new-user acceptance and display rules. The retired Samaritans email route is absent from normal public results.

## Privacy decisions

- Guest mode persists no profile.
- Public-device mode is session-only with a shorter expiry; private-device mode is designed for encrypted server persistence.
- Facts carry provenance, confirmation, update time, save/use-once preference and sensitivity classification.
- Consent receipts are field-, purpose-, recipient- and channel-specific and revocable.
- LGBTQIA+ identity is never auto-inserted by the autofill engine.
- Sensitive and stale values require explicit review. No evidence is attached and no form is submitted automatically.
- The shell includes a quick-exit control and explains the limits of history clearing.

## Autofill architecture

`src/content/test-form.json` defines a data-driven form contract. `src/domain/autofill.ts` joins the contract to confirmed profile facts and field definitions, enforces allowed purpose, flags stale/sensitive data, leaves missing fields empty and requires final review. It also renders script tokens only from confirmed facts and returns evidence as non-attaching suggestions. The demo allows each reused value to be edited or removed and intentionally has no submission side effect.

## Screens and flows

- `/`: controlled-dataset status, emergency path and primary navigation.
- `/support`: service directory rendered from the validated data layer.
- `/profile-demo`: guest/private/public-device controls and Fast Apply test flow.
- `/privacy`: plain-language privacy/session explanation.
- Global safe-exit, error and not-found states.
- Deterministic triage and session flows through API endpoints.

## Known limitations and Phase 2 work

- Apply `migrations/0001_phase1_foundation.sql` to a provisioned PostgreSQL instance and switch the preview catalog repository from revision files to database queries.
- Integrate an authentication provider before enabling persisted private profiles.
- Implement encrypted profile storage, key management, account recovery, retention/deletion jobs and audited consent revocation.
- Build council form adapters, exports and explicit submission hand-offs on the existing script/evidence contracts.
- Add caseworker roles, admin review queues, source re-verification workflows and revision publication UI.
- Complete manual visual, keyboard-only, screen-reader, zoom/reflow and supported-browser testing.
- Complete DPIA, safeguarding, content-owner and operational incident-response sign-off before public deployment.

## New release gates

- `DEPLOY-001`: PostgreSQL migration, backup/restore and revision-query verification in the target environment.
- `AUTH-001`: authentication, encryption/key-management and account lifecycle review before private profile persistence.
- `ACCESS-001`: manual cross-browser and assistive-technology verification.
- `GOV-001`: DPIA, safeguarding, editorial ownership and incident-response approval before public release.

These gates do not invalidate the completed Phase 1 code foundation; they prevent production deployment of later user-data and submission capabilities until their controls exist.
