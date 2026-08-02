# ADR 0001: Regional data isolation

## Context
Kent behavior must remain stable while unpublished regions are prepared independently.
## Decision
Use explicit region, authority, revision and publication-state records. Public reads require a published state and revision; free-text coverage remains display/audit data.
## Alternatives
Free-text-only geography and per-region code forks were rejected.
## Consequences
Imports and queries require a region boundary and publication join.
## Security impact
Region-scoped roles and tests prevent cross-region administration.
## Privacy impact
Regional administration contains no case data.
## Accessibility impact
Region selection must remain explicit and understandable.
## Migration impact
Additive tables preserve Kent IDs and existing services.
## Reversal strategy
Drop Phase 6 tables with the down migration; existing Kent tables remain intact.
