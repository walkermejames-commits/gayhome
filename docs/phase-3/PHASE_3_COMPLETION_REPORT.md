# Phase 3 completion report

Date: 2026-08-01. This report distinguishes implemented, tested code from external or human acceptance. Phase 3 is implemented as a gated technical foundation and is **not approved for production**.

## Repository changes

Changed files: `.env.example`; `.gitignore`; `artifacts/phase0/reconciliation-report.json`; `artifacts/phase2/deploy-001-restore-report.json`; `artifacts/v1.0.1/audit/reconciliation-report.json`; `docs/accessibility/MANUAL_TEST_PLAN.md`; `package.json`; `pnpm-lock.yaml`; `scripts/lib/logical-backup.mjs`; `scripts/release-gates.mjs`; `scripts/test-postgres-deploy.ts`; `src/app/case/page.tsx`; `src/app/globals.css`; `src/app/layout.tsx`; `src/server/env.ts`; `tests/accessibility.test.tsx`.

Added evidence, documentation and migrations: `artifacts/phase3/persona-security-report.json`; `docs/phase-3/IMPLEMENTATION_PLAN.md`; `docs/phase-3/RELEASE_GATES.md`; `docs/phase-3/PHASE_3_COMPLETION_REPORT.md`; `docs/security/gays againtst homlessness-threat-model.md`; `migrations/0003_phase3_casework.sql`; `migrations/down/0003_phase3_casework.down.sql`; `output/pdf/phase3-case-summary-proof.pdf`; `scripts/generate-phase3-pdf-proof.py`; `scripts/test-phase3-casework.ts`; `tests/casework.test.ts`.

Added server/domain/components: `src/domain/casework.ts`; `src/server/case-api.ts`; `src/server/casework.ts`; `src/server/pdf-export.ts`; `src/components/advocate-invite-form.tsx`; `src/components/case-add-form.tsx`; `src/components/case-create-form.tsx`; `src/components/case-nav.tsx`; `src/components/case-section.tsx`; `src/components/case-workflow-form.tsx`; `src/components/secure-workspace.tsx`.

Added pages: `src/app/case/new/page.tsx`; `src/app/case/[caseId]/page.tsx`; and `applications`, `complaints`, `deadlines`, `documents`, `duties`, `evidence`, `export`, `people`, `reviews`, `sharing`, `suitability`, `timeline` page files below that route; `src/app/advocate/page.tsx`; `src/app/advocate/invitations/page.tsx`; `src/app/advocate/cases/page.tsx`; `src/app/consent/page.tsx`; `src/app/settings/notifications/page.tsx`; `src/app/settings/sessions/page.tsx`; `src/app/settings/data/page.tsx`; `src/app/admin/casework/page.tsx`; `src/app/admin/safeguarding/page.tsx`; `src/app/admin/access-audit/page.tsx`.

Added APIs: `src/app/api/v1/cases/route.ts`; `src/app/api/v1/cases/[caseId]/route.ts`; and `applications`, `complaints`, `deadlines`, `documents`, `duties`, `events`, `evidence`, `export`, `reviews`, `search`, `suitability` route files below that route; `src/app/api/v1/advocate/invitations/route.ts`; `src/app/api/v1/advocate/invitations/accept/route.ts`; `src/app/api/v1/consent/route.ts`; `src/app/api/v1/consent/[consentId]/route.ts`.

## Migrations

`0001_phase1_foundation.sql`, `0002_phase2_runtime.sql` and `0003_phase3_casework.sql` all apply on isolated PostgreSQL 18. The Phase 3 migration covers cases, timeline, duties, applications, referrals, decisions, deadlines, tasks, evidence metadata, document versions, organisations/roles, invitations, grants, permissions, consent, suitability, complaints, reviews, safeguarding, exports, retention, break glass, communications and notification preferences. `migrations/down/0003_phase3_casework.down.sql` reverses Phase 3 only.

Proof: apply passed; rollback removed Phase 3; earlier migration records remained; reapply passed; active dataset remained `v1.0.1`; 55-table backup includes Phase 3; restore passed. The logical test does not substitute for a managed-provider PITR exercise.

## Casework

Case types cover homelessness, prevention, safe relocation, suitability, housing register, prison release, refugee/asylum, social care, harassment, unlawful eviction and other. All requested statuses and four urgency levels are constrained. Users can create/list/update cases; record encrypted timeline narratives; label privacy; track duty uncertainty, applications, deadlines and evidence metadata; and use suitability, complaint and review draft flows. The dashboard foregrounds next action, deadlines, council status, evidence, recent events and access rather than a professional grid.

Search is owner-only and searches non-encrypted operational labels inside one case. Encrypted narratives are deliberately not copied into an unprotected full-text index. AI suggestions are not generated; the schema prevents an AI-sourced timeline event without recorded user approval.

## Evidence

Evidence is **metadata-only**. Titles/descriptions are AES-256-GCM encrypted with per-record context. Schema supports hashes, sensitivity, retention, sharing, redaction version links, storage state and malware result. File bytes, direct object URLs and downloads do not exist; all metadata starts `blocked_pending_gate`. Therefore encryption-at-rest for file objects, scanning, type inspection, metadata stripping, redaction tooling and secure delivery are not claimed. `EVIDENCE-001` remains open and runtime configuration blocks premature activation.

## Documents

Twenty-six document types are allowlisted. A saved draft pins template ID/version, body encryption, field/evidence manifest, consent reference, author and immutable version number. No form or message sends externally. Submission status and communication tables require review metadata before verified sending.

PDF case summaries use selectable text, headings, page numbers, generated date, case reference, bounded content and a privacy-minimising manifest. A two-page synthetic ReportLab proof was text-extracted and visually inspected at 144 DPI with no clipping or overlap. The runtime generator uses `pdf-lib`. PDF/UA tags and assistive-technology sign-off are not proven, so `PDF-001` is partial.

## Advocacy

Owners create email-bound, hashed, expiring invitation tokens with selected permissions and sensitive categories. Acceptance requires the signed-in account's email hash to match. Active grant checks evaluate start, expiry, revocation and suspension on every request. Advocates do not receive the owner's access-list projection and cannot export without `export_documents`. Consent-bound revocation updates consent, invitation and grant in one transaction and took effect immediately in all fifteen synthetic journeys. External invitation email is disabled; development/test may expose a token for controlled testing only.

## Security

All implemented mutation APIs require a valid HttpOnly-cookie session, exact Origin, strict Zod input and parameterised SQL; high-risk creation endpoints are rate limited. Reads return no-store responses and use ownership/grant checks. Sensitive narrative content is excluded from audit metadata and tested for leakage. Admin pages require an active verified database role; they are queue shells and provide no casual content browser. CSP remains in the proxy.

The repository threat model identifies high risks: future endpoint IDOR, over-broad grants, key-plus-backup compromise, premature evidence/mail activation, privileged break glass and unapproved retention. No independent penetration test occurred. `PENTEST-001` remains open.

## Accessibility

Automated axe coverage now includes the advocate invitation form; 32 unit/component tests pass. Phase 3 controls use labels, fieldsets, live status, visible focus, 44-pixel controls, textual deadline certainty, keyboard-operable disclosures, reduced motion, reflow and print styles. The PDF proof is selectable and visually clean.

NVDA, VoiceOver/Safari, voice control, 400% manual journey tests and lived-experience sessions have not occurred. Evidence upload/preview cannot be tested because upload is disabled. `ACCESS-001` stays open and `PDF-001` stays partial.

## Deployment

Staging was not deployed: no hosted platform, PostgreSQL, KMS, object storage, malware scanner, mail sandbox or external credentials were available. No staging test accounts were created. The application remains `noindex`, and the release checker blocks missing configuration/approvals, non-HTTPS production, test auth outside test/development, evidence without `EVIDENCE-001` plus storage/scanner, and mail without `MAIL-001` plus provider. Active dataset is `v1.0.1` with 60 services, 13 councils, 12 triage routes, 12 scripts, 12 evidence categories and 73 sources.

## Tests

- `npm test`: pass, 7 files and 32 tests; jsdom emits its known canvas warning from axe.
- `npm run typecheck`: pass.
- `npm run lint`: pass.
- `pnpm audit --prod --audit-level high`: no known vulnerabilities.
- `npm run audit:dataset`: pass; active revision counts and zero unresolved active references.
- `npm run audit:source-history`: historical baseline remains one source behind `v1.0.1`, as already documented; active revision is sound.
- `npm run db:test:deploy`: pass; apply/down/reapply, dataset parity, idempotency, conflict quarantine, Phase 3 backup coverage and restore.
- `npm run test:phase3`: pass; fifteen synthetic personas, 150 relevant audit events, no tested narrative leak, cross-user denial, least privilege and immediate revocation.
- `npm run build`: pass; production route manifest includes all required Phase 3 pages and implemented APIs.
- PDF proof: 2 pages, 1,057 extracted characters, selectable text on every page, metadata present, visually inspected from PNG renders.

## Release gates

See `docs/phase-3/RELEASE_GATES.md`. `CASE-001` and `SHARE-001` are closed for automated technical acceptance. `PDF-001` and `RETENTION-001` are partial. `EVIDENCE-001`, `MAIL-001` and `PENTEST-001` are open. `SAFEGUARD-001` awaits human approval. Historical `AUTH-001` remains partial, `ACCESS-001` remains open, and `GOV-001` remains awaiting human approval.

## Known limitations

- Evidence files, redaction, malware scanning, secure object delivery, external mail, real notifications and real safeguarding referrals are disabled.
- Admin and professional pages are least-privilege shells; organisation onboarding, conduct queues and break-glass workflow require operational design.
- Retention tables exist, but no approved schedule, legal-hold procedure or production deletion worker exists.
- Complaint/review/suitability are structured drafts, not legal advice or automated determinations.
- Case export has a safe default manifest but not the complete interactive field/document selection interface for every pack type.
- The consent centre explains controls; full historical list/edit UI is not complete, though creation/revocation APIs and grant linkage exist.
- Account-backed profile/consent integration from Phase 2 remains incomplete, and approved passwordless email delivery remains absent.
- No staging URL, production database, KMS proof, provider PITR exercise, manual accessibility sign-off, legal approval, safeguarding owner or independent penetration test exists.

These limitations are release blockers, not hidden follow-up polish. Production must remain blocked.
