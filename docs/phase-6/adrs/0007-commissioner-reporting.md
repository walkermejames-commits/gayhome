# ADR 0007: Privacy-safe commissioner reporting

## Context
Service planning needs aggregate evidence without case access or re-identification.
## Decision
Reports use aggregate inputs, a minimum cell of five, limitation labels, period and revision metadata, and actual/projection labels.
## Alternatives
Case drill-down and unsuppressed small cells were rejected.
## Consequences
Some useful small-area figures are intentionally unavailable.
## Security impact
Commissioner roles query the reporting boundary, never cases.
## Privacy impact
Identifiable combinations and small cells are suppressed.
## Accessibility impact
Reports provide tables and text summaries; charts cannot stand alone.
## Migration impact
Adds aggregate report runs only.
## Reversal strategy
Disable live-report flag and retain approved static exports.
