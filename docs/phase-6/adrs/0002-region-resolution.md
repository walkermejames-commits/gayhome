# ADR 0002: Deterministic region resolution

## Context
Postcodes and housing circumstances can be ambiguous and local connection must not block help.
## Decision
Resolve only from reviewed mappings or explicit selections, return alternatives/confidence, and separate physical location, approach authority, settled address, local connection, preference and safety relocation.
## Alternatives
Geocoding by inference and silently choosing the first council were rejected.
## Consequences
Ambiguity creates a manual-selection step.
## Security impact
Untrusted inputs are schema-bounded and do not trigger external lookup.
## Privacy impact
Only the minimum location facts needed for resolution are used.
## Accessibility impact
Results explain why manual selection is needed.
## Migration impact
Adds optional mapping records without modifying existing council data.
## Reversal strategy
Disable regional routing and continue existing Kent behavior.
