# Phase 6 performance evidence

Synthetic unit budgets exercise 10,000 deterministic regional resolutions and 25,000 aggregate suppression cells. The verification scheduler, impact analysis, proposal state machine, translation invalidation and offline pack generator are pure bounded operations with no network requests or hidden caches.

The migration adds indexes for regional authority lookups, partner region/status, provider review queues and verification due queues. Provenance and audit history are retained rather than compacted away.

Integration must add database query-count and response-time measurements using the target’s Phase 4 observability environment for large verification queues, provider proposals, aggregate reports, translation retrieval, offline-pack generation, service-change impact and 15-stage publication validation. No production-sized Sussex dataset exists, so Phase 6 cannot honestly claim production load capacity.
