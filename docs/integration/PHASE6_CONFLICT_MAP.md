# Phase 6 conflict map

| Area | Baseline | Phase 6 source | Resolution and effect |
| --- | --- | --- | --- |
| History | Phase 5 at `15bf783` | Phase 6 based on Phase 3 | Non-fast-forward merge preserves both histories. |
| Package scripts | Phase 3–5 validation and guards | Added `test:phase6` | Retained every existing script and added Phase 6 plus Sussex-template verification. |
| Migration number | Phase 4 already owns `0004`; Phase 5 owns `0005` | Phase 6 supplied `0004` | Renamed the unapplied Phase 6 pair to `0006`; earlier migration bytes were untouched. |
| Partner organisations and agreements | Authoritative Phase 5 tables | Competing same-named tables | Removed competing creates/drops from Phase 6 migration; Phase 6 reuses Phase 5 records. |
| Partner users | `partner_memberships` | `partner_users` | Phase 6 authorization now maps active Phase 5 membership roles and additionally requires verified organisation and active agreement. |
| Provider proposals | `service_correction_proposals` | `provider_update_proposals` | Phase 6 API writes the authoritative Phase 5 proposal table; publication remains a separate reviewed revision action. |
| Managed services | No service-assignment junction | `partner_managed_services` | Added as Phase 6 scope enforcement. It has no case relationship. |
| Partner pages | Phase 5 operational shells/forms | Phase 6 organisation-scoped shells | Combined content; partner-facing pages use verified organisation access, while onboarding remains staff-controlled. |
| Backup/restore | Phase 1–5 allowlist | 34 Phase 6 tables and a dataset trigger | Added tables; restore suspends only the named regional-link trigger transactionally and serializes JSON columns correctly. |
| Flags | 16 governed Phase 5 pilot flags | 10 Phase 6 regional flags | Preserved separate registers and every false default; no Phase 5 flag was overwritten. |
| Gates | Canonical Phase 0–5 JSON register | Phase 6 Markdown register | Added Phase 6 gates to the canonical register without changing earlier states or closing human gates. |
| CI | Phase 1–5 checks | Phase 6 tests absent from integrated CI | Added `test:phase6` and controlled Sussex workbook verification. |
| Sussex template verification | No Phase 5 equivalent | Used unavailable workspace-only package | Reimplemented read-only verification with the existing `read-excel-file` dependency. |

Security outcome: partner and report routes retain server authorization; partner status never grants case access. Privacy outcome: reporting remains aggregate-only and offline content remains public-only. Accessibility outcome: Phase 5 tools remain intact and Phase 6 preference controls add guest-safe presentation settings. Migration outcome: the baseline advances monotonically from `0005` to `0006`.
