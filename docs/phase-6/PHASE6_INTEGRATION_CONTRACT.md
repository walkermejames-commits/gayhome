# Phase 6 integration contract

## Source and target

- Source branch: `codex/phase6-platform-expansion`
- Parent and starting commit: `316c2af7cc6c969d45b1cc9b866091e4d82192c2`
- Expected target: the integration machine’s independently reviewed Phase 4/Phase 5 stabilization branch, not automatically `main`.
- Phase 4 and Phase 5 refs were absent when Phase 6 began. Nothing in this branch replaces them.

## Additive implementation

- `src/phase6/`: regional resolution/IDs, partner proposals, verification scheduling/impact, taxonomy explanations, content versioning, accessibility, offline packs, adapters, reporting/cost/funder helpers, publication workflow, flags, and the internal portable case-export format.
- `src/server/phase6-authorization.ts`: server-only admin/partner boundaries. Partner access returns `caseAccess: false` and partner tables do not reference cases.
- `src/components/phase6-workspaces.tsx` and `accessibility-preferences.tsx`: protected route shells and guest presentation preferences.
- `src/app/api/v1/partner/proposals/route.ts`: same-origin, JSON-only, runtime-validated, organisation-scoped proposal submission. It accepts evidence references/metadata only and always returns `publicationAllowed: false`.
- New public, admin, partner, reporting, accessibility and offline routes listed below.
- `data/regions/sussex/`: empty source/revision/quarantine controls, CSV/JSON/XLSX templates, manifests, validation, reconciliation and publication checklist.
- `docs/phase-6/adrs/`: nine decision records.
- `tests/phase6-*.test.*` and `scripts/test-phase6-platform.ts`: synthetic functional/security/accessibility/performance and migration proof.

## Migration

The source branch supplied `0004_phase6_platform_expansion`; integration renames the unapplied pair to `migrations/0006_phase6_platform_expansion.sql` and `migrations/down/0006_phase6_platform_expansion.down.sql`. The integrated proof runs against the full Phase 5 baseline and preserves 60 services, a synthetic case and permission, pilot tables and authoritative partner tables through rollback/reapplication.

Critical integration rule: Phase 4 or Phase 5 may already own migration number `0004` on the target. If so, rename both Phase 6 migration files to the next unused sequential number before applying them, update only Phase 6 documentation/tests that mention the filename, and let the migration tool calculate the new checksum. Never edit an already-applied migration or reuse its recorded filename.

Inspect overlapping table names before apply. Phase 6 intentionally uses isolated names for `phase6_staff_roles`, `notification_templates_phase6` and `accessibility_preferences_phase6`; generic new names such as `regions`, `partner_organisations`, `translation_versions` and `integration_adapters` must be reconciled if an authoritative earlier implementation now exists. Prefer adapting this migration to the authoritative schema over creating parallel duplicate concepts.

## APIs and pages

API added: `POST /api/v1/partner/proposals`.

Pages added:

- Public: `/regions`, `/regions/[regionId]`, `/offline-help`, `/settings/accessibility`, `/settings/offline`.
- Administrative: `/admin/regions`, `/admin/regions/[regionId]`, `/admin/data-quality`, `/admin/verification`, `/admin/provider-proposals`, `/admin/translations`, `/admin/easy-read`, `/admin/publication`.
- Partner: `/partners`, `/partners/onboarding`, `/partners/services`, `/partners/proposals`. Onboarding is an inert public checklist; every workspace route performs server authorization.
- Reporting: `/reports/commissioner`, `/reports/service-gaps`, `/reports/cost-model`, `/reports/funder-pack` with administrator/commissioner server authorization.

## Feature flags

The migration creates ten governance records, all constrained/defaulted false: `sussex_routing`, `provider_self_service_publication`, `commissioner_live_reports`, `pwa_installation`, `push_notifications`, `council_direct_submission`, `live_translation`, `bsl_streaming`, `partner_analytics`, and `multi_region_case_transfer`.

Do not map these to Phase 5 pilot/production flags without individual owner, dependency, risk, environment, expiry and approval review. A flag never replaces server authorization.

## Expected dependencies

Phase 4 is expected to supply final production auth hardening, security review, backup/recovery, access-control verification and deployment guards. Phase 5 is expected to supply the authoritative readiness matrix, pilot controls, operational ownership and impact governance. None were available to verify. During integration:

1. Replace or adapt `requirePhase6Admin` only if the target has an authoritative role service; retain server-side role checks and partner/case separation.
2. Add Phase 6 tables to the target’s authoritative backup allowlist only after retention/data-classification review. The Phase 3 backup script was intentionally not modified in parallel.
3. Map Phase 6 flags into the authoritative flag service while preserving every false default.
4. Connect reporting only to an approved aggregate projection, never the case repository.
5. Keep adapters and provider publication disabled until their gates are independently approved.

## Shared files changed and overlap risk

`package.json` adds only `test:phase6`. `scripts/test-postgres-deploy.ts` now rolls the additive Phase 6 migration down before its existing Phase 3 rollback proof, then reapplies both; this is necessary because Phase 6 tables reference Phase 3 users. Reconcile that small test-harness change with any Phase 4/5 migration lifecycle updates. No existing auth, case permissions, evidence storage, release-gate register, deployment configuration, global stylesheet, layout or earlier migration was edited.

Generated baseline tests changed existing JSON proof timestamps locally; those changes are not part of Phase 6 and must remain excluded from commits. The workbook build may create inspection sidecars; only the controlled workbook and output evidence should be retained.

Highest conflict risks are migration numbering/schema overlap, later role/flag services, and any Phase 4 middleware policy for the new routes. New routes must be added to Phase 4’s protected-route coverage tests even though each protected page/API also authorizes at the server boundary.

## Recommended merge order

1. Stabilize and test Phase 4, then Phase 5, on the integration target.
2. Cherry-pick Phase 6 documentation/baseline and inspect assumptions.
3. Integrate pure `src/phase6` modules and their unit tests.
4. Reconcile/rename the migration, apply it to a copy of the target database, then run rollback/reapply and preservation queries.
5. Integrate server authorization and API; reconcile role and audit services.
6. Integrate pages/components and add route coverage to the target middleware/security suite.
7. Integrate templates and operational documents.
8. Keep all flags false and run the complete post-merge checks before independent review.

## Required conflict checks

- Confirm Kent external IDs and `v1.0.1` revision are byte-for-byte unchanged.
- Search for competing region, partner, translation, Easy Read, adapter, reporting and feature-flag models.
- Verify partner/commissioner roles have no route, SQL view, grant or foreign-key path to private cases.
- Confirm Sussex has zero service/contact/route records and no public resolver revision.
- Confirm state-changing API coverage includes origin validation, runtime schema validation, least privilege, no-store responses and audit.
- Confirm no service worker, install prompt, push registration, external fetch/submission or production adapter was introduced by conflict resolution.
- Re-run the target release guard and retain every earlier gate state.

## Required post-merge tests

Run `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run audit:dataset`, `npm run db:test:deploy`, `npm run test:phase3`, `npm run test:phase6`, `pnpm audit --audit-level high`, and the authoritative Phase 4/5 preflight/release checks. Add runtime unauthenticated/unauthorized requests for every new admin, partner and report route, plus an authenticated cross-organisation proposal attempt. Repeat browser keyboard, screen-reader, 400% zoom/reflow, high-contrast, reduced-motion, voice-control and mobile-navigation review. Inspect every Sussex workbook sheet after any template merge.

## Rollback

Before integration, take and verify the target’s approved backup. Disable every Phase 6 flag and adapter. Roll back application routes/modules, then run the correctly renumbered Phase 6 down migration. Verify counts and checksums for Kent services, revisions, users, cases, consents, access grants and permissions. Reapply only after the cause is resolved. Sussex never requires public rollback because it must remain unpublished.
