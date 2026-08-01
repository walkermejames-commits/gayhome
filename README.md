# Kent LGBTQIA+ Housing and Homelessness Navigator

Safety-critical housing navigation and casework software for Kent and Medway.

Phase 0 is approved and `DATA-001` remains resolved through controlled revision `v1.0.1`. Phase 2 implementation and its verified/open gates are documented in [`docs/phase-2/PHASE_2_COMPLETION_REPORT.md`](docs/phase-2/PHASE_2_COMPLETION_REPORT.md).

The product promise is:

> Tell us once. Understand your options. Take the next step. Keep control of your information. Know what to do if the system fails.

## Source-of-truth policy

- `data/source/kent_lgbtq_homelessness_resource_seed.json` is immutable Phase 0 evidence.
- `data/source/Kent_LGBTQ_Homelessness_Resource_Database_v1.xlsx` is the controlled editorial, bulk-review, reconciliation and QA representation.
- Neither file is generated, overwritten or silently repaired by audit tooling.
- Derived audit output belongs under `artifacts/`, never under `data/source/`.
- The active controlled revision is `data/revisions/v1.0.1/`; application content is loaded through validated import and domain layers.

## Phase 0 deliverables

- [`docs/phase-0/DATASET_AUDIT.md`](docs/phase-0/DATASET_AUDIT.md): hashes, counts, reconciliation and integrity gates.
- [`docs/phase-0/FOUNDATION.md`](docs/phase-0/FOUNDATION.md): database mapping, import strategy, schema, autofill, triage, consent, UI, delivery plan and acceptance criteria.
- [`docs/phase-0/RISK_REGISTER.md`](docs/phase-0/RISK_REGISTER.md): privacy, safeguarding, legal-information and security risks.
- `scripts/phase0-audit.mjs` and `scripts/reconcile-phase0.mjs`: repeatable, read-only dataset audit utilities.

## Development

```powershell
pnpm install
pnpm audit:dataset
pnpm import:datasets
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm dev
```

Set `DATABASE_URL` before running `pnpm db:migrate`. The local preview otherwise uses the validated controlled revision directly.

Run `pnpm db:test:deploy` for the isolated PostgreSQL migration/import/restore proof. Production release remains blocked by `pnpm release:check` until required configuration and authorised governance/accessibility approvals exist.
