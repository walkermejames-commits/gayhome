# Phase 3 implementation plan

Verified baseline date: 2026-08-01.

1. **Completed:** audit Phase 2. Active dataset `v1.0.1`; 25 baseline tests; build, lint, typecheck, dataset audit, dependency audit and PostgreSQL deployment proof passed. Staging was not deployed, authentication delivery remained partial, `ACCESS-001` and governance remained open.
2. **Completed:** add reversible Phase 3 casework schema, indexes, FK/deletion rules and backup coverage. Prove apply, down, preservation of prior migrations, reapply and logical backup inclusion.
3. **Completed for implemented core:** enforce authenticated ownership, granular active grants, consent-bound advocate invitations, immediate revocation, Origin checks, strict validation, parameterised SQL, rate limits, no-store errors and audit metadata.
4. **Completed for implemented core:** case dashboard, timeline, duties, applications, deadlines, encrypted evidence metadata, versioned document drafts, advocate workspaces, controlled workflow pages and safe case search.
5. **Completed with an open gate:** selectable-text PDF export, page numbers, date, reference and minimal default manifest. Tagged-PDF and assistive-technology sign-off remain open.
6. **Deliberately disabled:** evidence file bytes, direct object links, malware processing, external mail and real safeguarding referrals.
7. **Completed:** automated unit/accessibility checks, fifteen synthetic PostgreSQL persona journeys, cross-user and revoked-access denial, migration/restore proof and threat model.
8. **Blocked externally:** staging, managed database, KMS, object storage, scanner, mail sandbox, test accounts and independent penetration test require credentials/organisational decisions.
9. **Required before production:** close every release gate listed in `RELEASE_GATES.md`; do not infer approval from code or automated tests.
