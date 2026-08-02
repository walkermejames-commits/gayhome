# ADR 0006: Disabled adapter framework

## Context
Future external systems need consistent safety controls without live activation.
## Decision
Adapters declare state, validation, timeout, retry, circuit, audit and data allowlist. Every configured adapter defaults disabled; council submission additionally requires verified status, approval and no prohibited CAPTCHA automation.
## Alternatives
Page-level integrations and implicit environment activation were rejected.
## Consequences
Integrations require a reviewed adapter implementation and gate evidence.
## Security impact
Payload minimisation and fail-closed execution are central.
## Privacy impact
Adapters receive only allowlisted fields.
## Accessibility impact
Manual accessible alternatives remain required.
## Migration impact
Adds registries, not credentials or live endpoints.
## Reversal strategy
Set state disabled and remove the adapter implementation.
