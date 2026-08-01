# Dataset revision v1.0.1

Parent: `v1`
Effective date: `2026-08-01`
Reason: Resolve `DATA-001` and update the Samaritans 2026 contact transition.

## Controlled changes

- Added one source record: `src_samaritans`.
- Updated one dependent service record: `srv_samaritans`.
- Updated revision metadata from `v1` / `2026-07-31` to `v1.0.1` / `2026-08-01`.
- Preserved all stable identifiers and every existing triage relationship.
- Changed no other service, council, triage, script, evidence or source content.

The official verification source is the Samaritans email-transition notice: https://www.samaritans.org/how-we-can-help/email-service-closing/.

## Validation outcome

Both revised datasets contain 60 services, 13 councils, 12 triage routes, 12 scripts, 12 evidence records and 73 sources. JSON/workbook parity is exact across mutually represented fields. All service, council and triage references resolve. The JSON-only `triage_routes.verified_on` asymmetry remains documented and unchanged.

Workbook checks confirm eight visible sheets, zero formulas, zero validations, zero filters, seven structured tables and twelve merged ranges before and after repair. `SourcesQATable` now extends through the new row at `A2:G75`. All sheets were re-rendered and visually reviewed.

`DATA-001` is resolved but remains in the audit history.
