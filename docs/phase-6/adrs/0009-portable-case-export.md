# ADR 0009: Internal portable case export

## Context
Future interoperability needs a stable, honest package format.
## Decision
Define `navigator-internal-portable-case-v1` with manifest, sensitivity, revision, timeline, deadlines, references, selected evidence index and SHA-256 checksum. Evidence bytes are excluded unless separately selected and approved.
## Alternatives
An undocumented database dump and claiming a national standard were rejected.
## Consequences
Consumers must explicitly support this internal version.
## Security impact
Exports require existing case authorization and safe delivery controls.
## Privacy impact
Selection and sensitivity metadata support minimisation.
## Accessibility impact
Human-readable accessible PDF remains a companion, not the sole format.
## Migration impact
No existing case schema changes are required.
## Reversal strategy
Stop producing the format while retaining checksummed historical exports under retention rules.
