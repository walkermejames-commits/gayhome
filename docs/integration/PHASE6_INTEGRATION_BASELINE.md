# Phase 6 integration baseline

Recorded: 3 August 2026

| Item | Verified value |
| --- | --- |
| Canonical remote | `https://github.com/walkermejames-commits/gayhome.git` |
| Verified baseline branch | `codex/phase5-pilot-operations` |
| Verified baseline commit | `15bf783455d9c84f630fbfd5dbf0c099601a32f0` |
| Integration branch | `codex/phase6-integration` |
| Phase 6 source branch | `origin/codex/phase6-platform-expansion` |
| Phase 6 source commit | `2f8183c0b4e64423b8115fbbd3c7e96748ae9a96` |
| Phase 6 source parent/base | `316c2af7cc6c969d45b1cc9b866091e4d82192c2` |
| Merge base with Phase 5 | `316c2af7cc6c969d45b1cc9b866091e4d82192c2` |
| Pre-integration migration level | `0005_phase5_pilot_operations.sql` |
| Integrated migration level | `0006_phase6_platform_expansion.sql` |
| Active dataset revision | `v1.0.1` |

Phase 6 contains six source commits covering regional architecture, partner/verification controls, content/accessibility versioning, offline and adapter contracts, aggregate reporting, Sussex templates, tests and handoff documentation. It was intentionally developed from Phase 3 because Phase 4/5 refs were unavailable on that machine. A non-fast-forward merge preserves both histories; nothing from Phase 4 or Phase 5 is replaced.

The source implements domain logic, database models, one partner proposal API, protected review pages, synthetic tests and controlled templates. External adapters, PWA installation, push notifications, live translation, direct council submission, Sussex routing and provider publication are disabled. BSL/media, translation, Easy Read, offline and commissioner functionality are governed infrastructure or review shells rather than approved live services.

Existing user-owned `.codex-tmp/` and `MASTER_BUILD_PROMPT.md` paths remained locally excluded and were not changed or committed.
