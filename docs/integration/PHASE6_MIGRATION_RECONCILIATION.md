# Phase 6 migration reconciliation

The source migration was unapplied and named `0004_phase6_platform_expansion.sql`. Because the verified baseline already contains immutable Phase 4 `0004` and Phase 5 `0005`, both Phase 6 migration files were renamed to `0006_phase6_platform_expansion.sql` before integration. No previously applied migration was edited.

Competing Phase 6 definitions for `partner_organisations`, `partner_agreements`, `partner_users` and `provider_update_proposals` were removed. The integrated implementation uses Phase 5 `partner_organisations`, `partner_agreements`, `partner_memberships` and `service_correction_proposals`; Phase 6 adds only regional contacts, locations and managed-service scope around those authoritative records.

`pnpm test:phase6` applies migrations 0001–0006 to an isolated PostgreSQL database, seeds controlled Kent `v1.0.1`, creates a synthetic case and permission, rolls Phase 6 down, verifies Phase 4/5 and partner tables remain, checks record counts, and reapplies Phase 6. The result preserved 60 services, one synthetic case, one permission and the Phase 5 partner table; all ten Phase 6 flags remained false.

`pnpm db:test:deploy` additionally rolls migrations 0006–0003 down and reapplies them, verifies canonical Kent parity, creates and restores a logical backup containing 118 tables, and confirms services, profiles, Phase 3 casework, Phase 5 pilot controls and Phase 6 regional records are included. A regression found during integration was repaired: the regional dataset trigger is transactionally disabled only while ordered backup rows are restored, then re-enabled before commit. JSON/JSONB values are serialized according to column metadata so array-shaped JSON restores correctly.

Down migration `0006_phase6_platform_expansion.down.sql` removes only Phase 6-owned objects. It does not drop the authoritative Phase 5 partner or proposal tables. Sussex remains blocked and contains no operational service, council, route, source or contact rows.
