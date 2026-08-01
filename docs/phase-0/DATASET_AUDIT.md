# Phase 0 dataset audit

Audit date: 2026-08-01 (Europe/London)

## Repository audit

The workspace began as an empty Git repository with no commits and no application code. The two supplied datasets were outside the repository in `C:\Users\imedt\Downloads`. Byte-identical copies were placed under `data/source/`; the originals were left untouched.

## File integrity

| File | Bytes | SHA-256 |
|---|---:|---|
| JSON runtime seed | 98,649 | `D41B7056CBA08EDC8951C5360F33054CD0FF3A9FBDCAE4F0425BA0889A155311` |
| Excel editorial/QA workbook | 45,409 | `B8F921BB33F326CB167A55EBAA32A8621DE4D5F94C166ABDA955E182E35BB54F` |

## Parsed inventory

The JSON metadata identifies version `v1`, verified on `2026-07-31`, with the explicit warning: “Seed data; re-check provider routes before production release.”

| Collection | JSON records | Workbook records | Stable-ID match | Compared-cell differences |
|---|---:|---:|---|---:|
| Services | 60 | 60 | Exact | 0 |
| Councils | 13 | 13 | Exact | 0 |
| Triage routes | 12 | 12 | Exact | 0 |
| Scripts | 12 | 12 | Exact | 0 |
| Evidence checklist | 12 | 12 | Exact | 0 |
| Sources | 72 | 72 | Exact | 0 |

Workbook sheets inspected and visually rendered: `START HERE`, `Services`, `Councils`, `Triage routes`, `Scripts`, `Evidence checklist`, `App schema`, and `Sources & QA`. Every sheet is populated and legible; the workbook contains title and header rows in addition to the record counts above.

## Encoding and mapping observations

- Stable identifiers use collection-specific prefixes (`srv_`, `council_`, `route_`, `script_`, `ev_`, `src_`) and must remain external keys.
- Multi-value fields such as service tags, access modes, triage condition tags and triage target IDs are pipe-delimited strings in both source formats. Import must split on `|`, trim values, preserve source order for export, and reject empty tokens.
- The workbook and JSON match across every field that the workbook represents.
- `triage_routes.verified_on` exists only in JSON. The workbook's `Triage routes` sheet has no equivalent column. This is a controlled asymmetry, not a value conflict; the export specification must either add the column in a future workbook version or document JSON ownership of this field.
- `council_by_area` is a deliberate symbolic triage target, not a missing service ID. It resolves through the council-area matcher.

## Integrity results

Passed:

- Expected collection counts.
- Unique stable IDs within all six collections.
- All 13 council source references resolve.
- All concrete triage targets resolve to a service, council or the permitted `council_by_area` token.
- Every critical triage route has at least one target.
- Workbook/JSON record identity and represented-field equality.
- No source is overdue as of 2026-08-01; the earliest calculated next review date is 2026-08-30.

Historical failure — release gate `DATA-001`:

- Service `srv_samaritans` references `src_samaritans`, but no such record exists in the 72-item `sources` collection or the `Sources & QA` sheet.
- This breaks the requirement that every operational recommendation has provenance.
- The source was not invented automatically. On 2026-08-01 an authorised instruction supplied the exact repair and verification source.

Resolution: `DATA-001` was resolved in controlled revision `v1.0.1`. The immutable Phase 0 evidence remains unchanged. See `data/revisions/v1.0.1/REVISION.md` and its manifest for hashes, changes and validation evidence.

## Phase decision

Phase 0 architecture work was permitted while the gate remained open. Phase 1 became authorised only after revision `v1.0.1` passed the complete post-repair audit.

The machine-readable evidence is in `artifacts/phase0/reconciliation-report.json`. The audit scripts are read-only with respect to both source files.
