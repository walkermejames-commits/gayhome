# Sussex validation rules

1. Reject unknown columns and invalid JSON cells.
2. Require the registered `esx`, `wsx` or `bnh` prefix and reject collisions with every existing stable ID.
3. Require every source reference to resolve to an HTTPS authoritative source with retrieval date.
4. Require every triage target and fallback to resolve within the same controlled revision.
5. Preserve display coverage while validating structured geography.
6. Quarantine records with missing contacts, accessibility status, ownership, safeguarding review or legal review.
7. Accept only `draft` import status; templates cannot request publication.
8. Compare workbook, CSV and JSON counts, IDs and field values before review.
9. Reject formulas, macros, external workbook links and executable or binary evidence.
10. Keep `SUSSEX-DATA-001` open until every publication checklist item has independent evidence.
