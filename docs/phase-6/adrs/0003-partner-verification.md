# ADR 0003: Partner verification and proposals

## Context
Providers need a correction channel without publication or case privileges.
## Decision
Use organisation-scoped users, active agreements, least-privilege roles and a proposal state machine. Publication belongs to a separate publisher role.
## Alternatives
Direct editing and treating verified status as case access were rejected.
## Consequences
Corrections wait for controlled review and dataset revision.
## Security impact
Server authorization binds every write to the caller’s organisation; evidence bytes are not accepted.
## Privacy impact
Partner tables have no case foreign keys.
## Accessibility impact
Portal controls use semantic forms and status text.
## Migration impact
Adds isolated partner tables.
## Reversal strategy
Disable partner access and retain proposals as audit history before dropping tables if approved.
