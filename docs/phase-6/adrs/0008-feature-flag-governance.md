# ADR 0008: Phase 6 feature-flag governance

## Context
Parallel work must not activate unreviewed capabilities.
## Decision
Persist owner, environment, approvals, dependencies, risk and review metadata. Database checks and code defaults force all ten Phase 6 flags off.
## Alternatives
Environment-only booleans and UI-hidden features were rejected.
## Consequences
Activation requires a later audited change and human gate evidence.
## Security impact
Flags cannot substitute for server authorization.
## Privacy impact
High-risk sharing/reporting flags remain off.
## Accessibility impact
PWA, notifications, translation and BSL require dedicated approval.
## Migration impact
Adds a separate flag registry without modifying earlier flags.
## Reversal strategy
Keep flags disabled and remove Phase 6 consumers.
