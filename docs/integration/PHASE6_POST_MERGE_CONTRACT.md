# Phase 6 post-merge contract

| Item | Contract value |
| --- | --- |
| Integration branch | `codex/phase6-integration` |
| Baseline commit | `15bf783455d9c84f630fbfd5dbf0c099601a32f0` |
| Phase 6 source commit | `2f8183c0b4e64423b8115fbbd3c7e96748ae9a96` |
| Integration implementation commit | Recorded after the merge commit is created |
| Migration level | `0006_phase6_platform_expansion.sql` |
| Active dataset revision | `v1.0.1` |

New API: `POST /api/v1/partner/proposals`. New pages cover public/admin regions, data quality, verification, provider proposals, publication, translation, Easy Read, offline help, accessibility/offline settings, commissioner/service-gap/cost/funder reports, and organisation-scoped partner workspaces.

The ten Phase 6 flags and ten Phase 6 gates are listed in `PHASE6_INTEGRATION_REPORT.md`. All flags remain false. All human-review gates remain open or awaiting approval. Disabled capabilities include Sussex routing/publication, direct provider publication, live reporting, PWA installation, push, council submission, live translation/BSL streaming, partner analytics, multi-region case transfer and all external adapters.

Known limitations: manual accessibility/device testing, independent permission/privacy/security review, penetration testing, authoritative Sussex data and governance, external infrastructure and live adapter verification remain outstanding. The safe next development branch should be created from the reviewed mainline with the `codex/` prefix; it must not activate a gated capability without its accountable approval.
