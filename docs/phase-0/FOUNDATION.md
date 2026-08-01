# Phase 0 foundation specification

This document provides the twelve required pre-coding outputs. It is an architecture decision record, not a claim that the application has been built.

## 1. Repository audit

The repository contains only controlled source assets, repeatable audit tooling and Phase 0 documentation. There is no inherited framework, deployment configuration, database or application code to preserve. The greenfield state supports a modular monorepo, but production work is gated by `DATA-001` in the dataset audit.

## 2. Dataset audit

The canonical JSON and editorial workbook agree on record membership and all mutually represented fields. Counts are 60 services, 13 councils, 12 routes, 12 scripts, 12 evidence records and 72 sources. Stable IDs are unique. One service-to-source reference is unresolved, and triage verification date is JSON-only. Full evidence is in `DATASET_AUDIT.md`.

## 3. Database mapping

| Source concept | Staging | Published model | Important relationships |
|---|---|---|---|
| `metadata` | `import_metadata` | `dataset_revisions` | One immutable revision per approved import |
| `services` | `stg_services` | `services`, `service_revisions` | Source, tags, access modes, geographic coverage |
| `councils` | `stg_councils` | `councils`, `council_revisions` | Source and region/area aliases |
| `triage_routes` | `stg_triage_routes` | `triage_routes`, `route_conditions`, `route_targets` | Targets services or symbolic resolvers |
| `scripts` | `stg_scripts` | `scripts`, `script_revisions`, `script_fields` | Audience and approved autofill placeholders |
| `evidence_checklist` | `stg_evidence` | `evidence_categories`, `evidence_guidance_revisions` | Case documents and safety handling |
| `sources` | `stg_sources` | `sources`, `source_verifications` | Provenance, verification interval and status |
| Workbook `App schema` | import documentation | schema decision records | Advisory; not a complete production schema |

Source stable IDs remain immutable `external_id` values with unique constraints. Internal UUIDv7 keys support regional expansion and avoid leaking sequence information. Published content is revisioned; references bind to a dataset revision so historical recommendations remain reproducible.

## 4. Import and reconciliation strategy

1. Accept JSON or `.xlsx` into quarantined object storage; record SHA-256, size, MIME type, uploader, time and parser version.
2. Reject macros, password protection, schema drift, malformed rows, duplicate IDs, unsafe formulas and unexpected external workbook links.
3. Parse to typed staging tables. Preserve raw row JSON, source sheet/row, original text and normalised values.
4. Convert pipe-delimited fields to ordered child rows. Do not silently collapse duplicates or unknown tags.
5. Validate expected counts for the initial seed, required fields, URLs, dates, statuses, source references, route targets and safety invariants.
6. Reconcile by stable external ID and field. Classify additions, edits, archives, reference changes and conflicts; calculate route-impact scope.
7. Require dual approval for critical-route, emergency-contact, safeguarding-script or source-provenance changes. Ordinary edits require the role assigned by policy.
8. Publish transactionally as a new immutable dataset revision. Keep the previous revision active until the new revision commits completely.
9. Export deterministically to JSON and workbook, preserving IDs, ordering and pipe-delimited round trips.
10. Support rollback by switching the active revision pointer, never by deleting history.

Idempotency key: `(file_sha256, parser_version, import_kind)`. Reimporting an identical asset returns the prior import result and cannot duplicate records.

## 5. Normalised schema

Core content:

- `regions`, `areas`, `area_aliases` make Kent/Medway data portable to later regions.
- `dataset_imports`, `dataset_revisions`, `import_rows`, `reconciliation_items`, `approval_decisions` preserve provenance and workflow.
- `services`, `service_revisions`, `service_contacts`, `service_coverage`, `tags`, `service_tags`, `access_modes`, `service_access_modes` normalise the directory.
- `councils`, `council_revisions`, `council_areas` resolve location routes.
- `triage_routes`, `triage_route_revisions`, `route_conditions`, `route_targets` encode deterministic, ordered safety behaviour.
- `scripts`, `script_revisions`, `script_fields` hold approved communication templates and explicit placeholder contracts.
- `evidence_categories`, `evidence_guidance_revisions` drive evidence guidance without making documents mandatory for emergency help.
- `sources`, `source_verifications`, `verification_tasks`, `reported_corrections` provide operational provenance.

User/case domain:

- `users`, `guest_sessions`, `profiles`, `profile_subjects`, `profile_facts`, `fact_revisions`, `communication_preferences` implement “tell us once”.
- `cases`, `case_events`, `applications`, `referrals`, `tasks`, `deadlines`, `accommodation_offers`, `suitability_concerns` support casework.
- `documents`, `document_versions`, `document_classifications`, `evidence_links` store encrypted evidence and explicit case relationships.
- `consents`, `consent_scopes`, `consent_receipts`, `delegations`, `advocate_access_grants` enforce purpose-specific access.
- `generated_artifacts`, `submission_reviews`, `submission_receipts` ensure user review before sending.
- `audit_events`, `security_events`, `retention_policies`, `deletion_jobs`, `export_jobs` support accountability and user rights.

Sensitive fact values and document keys use envelope encryption with separate keys per subject/case where practical. Search indexes contain approved derived tokens, never raw special-category narratives.

## 6. Autofill architecture

Autofill is a foundational service, not form-local convenience code.

Each field definition declares: semantic key, subject, datatype, sensitivity tier, allowed purposes, freshness policy, validation rules, source/provenance requirements and whether explicit confirmation is required. A fact revision records value, provenance, observed date, confidence/verification status and supersession.

Resolution order is deterministic: user-confirmed case fact, user-confirmed profile fact, trusted imported fact, then blank. Conflicts never overwrite; they produce a review prompt. Sensitive values are purpose-filtered before a form receives them. Generated letters receive only fields permitted by the selected consent scope. Every preview shows reused fields, source and recipient; sending always requires confirmation.

Fast Apply computes missing required fields from a versioned form contract, asks only for missing/stale/contradictory facts, then writes confirmed answers back through the same fact service. It must support guest/session-only storage, profiles for dependants, safe-contact rules and reusable reasonable adjustments.

## 7. Triage architecture

Triage is a deterministic rules engine evaluated before search or AI. Inputs are minimal typed facts: immediate danger/medical emergency, safe place tonight, age band, council area, abuse risk, communication safety and route-specific conditions.

Rules are immutable per dataset revision and evaluated by explicit priority, specificity and stable route ID. Targets resolve to published service revisions or symbolic resolvers such as `council_by_area`. The response includes action order, explanation, safety note, provenance, last checked, fallback and escalation timing.

Hard invariants include: 999 before non-emergency flows when immediate danger applies; under-18 safeguarding routes before adult homelessness routes; council emergency route before secondary support for no-safe-place-tonight; no treatment, evidence or LGBTQIA+ disclosure prerequisite; and no AI override. If a target is unavailable or unverified, the engine uses a pre-approved fallback and raises an operational alert.

## 8. Consent architecture

Consent is an append-only, purpose-specific receipt, not a global boolean. It names subject, actor, recipient, data categories, purpose, channel, expiry, legal notice version and revocation state. Sharing checks ownership/delegation, current scope, recipient and field sensitivity at request time.

Separate controls govern: saving a profile, storing special-category facts, document processing, AI assistance, contacting a provider, council submission, advocate access and analytics. Withdrawal blocks future processing where consent is the basis but does not erase audit evidence required for security or legal obligations. Guest mode defaults to no server persistence; session-only mode makes that boundary visible.

The controller must determine and document the Article 6 lawful basis and Article 9 condition before processing special-category data; consent is not assumed to be the correct basis for every operation. The ICO requires a DPIA for likely high-risk processing and highlights large-scale special-category data and dataset matching as triggers: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-impact-assessments/ and https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/special-category-data/.

## 9. Privacy and threat model

System boundaries are: public/guest browser, authenticated user browser, advocate portal, admin portal, application API, triage/autofill services, PostgreSQL, object storage, job workers, notification providers and optional AI processor. No service-data editor receives user-case access by default.

Primary controls: least-privilege RBAC plus case-scoped ABAC; phishing-resistant admin MFA; short-lived sessions; CSRF/XSS/CSP protections; rate limits; malware scanning; signed upload/download URLs; encryption; secret rotation; immutable security audit; restore tests; redacted structured logs; dependency scanning; and emergency kill switches for outbound messages and dataset publication.

Notification payloads use neutral copy and never contain sexuality, gender history, abuse, health, immigration status, safe-contact details or case narrative. Quick exit changes the visible page but never claims to erase device/browser traces. AI receives minimal redacted excerpts only after a separate purpose-specific approval; deterministic routes and verified operational facts remain authoritative.

The detailed risk register is in `RISK_REGISTER.md`.

## 10. UI map

```text
Neutral landing / discreet mode
├── Get help now
│   ├── Immediate danger / medical emergency
│   ├── Nowhere safe tonight
│   ├── Under 18
│   └── Abuse / hate / unsafe contact
├── I may lose my home
│   ├── Council route
│   ├── Prevention action plan
│   └── Evidence and script
├── Start or continue an application
│   ├── Universal profile
│   ├── Fast Apply: missing questions only
│   ├── Review reused information
│   └── Submit / save / print
├── My action plan / My case
│   ├── Tasks and deadlines
│   ├── Timeline and receipts
│   ├── Referrals and applications
│   └── Escalation and review
├── Find support
│   ├── Guided recommendations
│   └── Service directory and council finder
├── Evidence
├── Letters and scripts
├── My profile / reasonable adjustments
├── Help someone else / advocate access
└── Privacy, export, delete and safe exit

Admin portal (separate trust boundary)
├── Imports and reconciliation
├── Content approval and route-impact review
├── Verification and correction queues
├── Revision export / rollback
└── Audit, retention, incidents and feature flags
```

Each crisis screen has one principal action, keyboard and screen-reader support, text alternatives, visible focus, reduced-motion behaviour, low-bandwidth rendering, safe-contact controls and a persistent quick exit. WCAG 2.2 is the test baseline; W3C describes its success criteria as technology-independent and testable: https://www.w3.org/TR/WCAG22/.

## 11. Development plan

Phase 1 — Foundation: resolve `DATA-001`; establish the TypeScript monorepo; PostgreSQL/PostGIS; type-safe schema and validation; immutable dataset import/reconciliation; revisioned service/council/source APIs; deterministic triage; fact/autofill and consent services; threat model; wireframes; and automated database tests.

Recommended stack: TypeScript end to end; Next.js App Router for the accessible progressive web app and admin UI; a separate typed application/service layer; PostgreSQL with PostGIS for area resolution; Drizzle ORM plus SQL migrations; Zod at trust boundaries; S3-compatible encrypted object storage; a PostgreSQL-backed job worker; OpenAPI; Playwright, Vitest and axe-core; containers for reproducible development; OpenTelemetry-compatible logs/traces. Keep domain packages framework-independent so native apps, kiosks and other regions can reuse them.

Phase 2 — Public prototype: guest and discreet modes, crisis entry, council finder, service matching, action plan, Universal Profile, Fast Apply, scripts, evidence guidance and accessibility controls.

Phase 3 — Casework: secure accounts, timelines, documents, referrals, application tracking, tasks, reminders, advocate grants, Profile Packs and review/complaint workflows.

Phase 4 — Administration: controlled imports, reconciliation, approvals, editors, verification queues, route-impact analysis, corrections, export and rollback.

Phase 5 — Hardening: independent accessibility and penetration tests, DPIA sign-off, safeguarding/legal review, provider verification, lived-experience testing, recovery exercises, incident plan and launch gates.

Each phase ships small reversible migrations and tests. No user-facing visual polish outranks crisis correctness, consent or data integrity.

## 12. Acceptance criteria

Foundation acceptance requires:

- Both source files hash to the approved values and import without mutation.
- Counts, stable-ID uniqueness, references and pipe-delimited round trips pass.
- `DATA-001` is resolved by an authorised, evidenced change in both controlled formats.
- Reimport is idempotent; conflicts enter a review queue; publication is atomic and reversible.
- All public recommendations point to an approved source verification and dataset revision.
- Deterministic triage persona tests cover every critical route and fallback; AI cannot change route order or facts.
- Autofill asks only for missing/stale/contradictory fields, respects purpose scopes and requires review before sending.
- Guest/session-only and safe-contact behaviours are demonstrably private.
- Ownership, consent, advocate delegation, admin separation and audit checks pass at API and database levels.
- No critical/high accessibility defects remain against WCAG 2.2 AA, including complete end-to-end processes.
- Export, deletion, retention, backup/restore, broken-target fallback and rollback tests pass.
- Legal, safeguarding, DPIA, provider-verification and lived-experience sign-offs are recorded before production.

Legal-information content must be versioned against the current official Homelessness Code of Guidance, which was updated on 1 May 2026: https://www.gov.uk/guidance/homelessness-code-of-guidance-for-local-authorities/download-this-guidance. It must remain explanatory and must not make final eligibility determinations.
