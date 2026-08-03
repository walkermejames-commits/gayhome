# ADR 0005: Offline public content

## Context
People may need low-bandwidth help, but shared-device caches create privacy risk.
## Decision
Generate allowlisted public packs only. PWA installation, service-worker activation, background sync and push stay disabled pending approval.
## Alternatives
Caching the full application or private routes was rejected.
## Consequences
Offline help is limited and always carries freshness metadata.
## Security impact
Private API, case, profile, consent and evidence paths are excluded.
## Privacy impact
Packs assert and test that private data is absent.
## Accessibility impact
Low-bandwidth HTML and printable content retain written emergency information.
## Migration impact
Adds public-pack metadata only.
## Reversal strategy
Invalidate public packs and remove the static route; no private cache needs cleanup.
