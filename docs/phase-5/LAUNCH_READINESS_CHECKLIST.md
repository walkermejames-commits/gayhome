# Pilot and public-launch readiness checklist

Status: **All deployment decisions blocked.**

Each row requires a named owner, evidence, open risks, decision and authorised approver. Blank ownership is a failed check.

| Category | Owner | Evidence | Open risks | Decision | Approver |
|---|---|---|---|---|---|
| Immutable release and rollback versions | Unassigned | `PHASE4-INTEGRATION-001` | Local candidate exists; remote publication, review and approved rollback version are absent | Block | Unassigned |
| Security and penetration testing | Unassigned | `PENTEST-001` | No independent test | Block | Unassigned |
| Privacy/controller/governance | Unassigned | Draft governance pack | No approved DPIA/controller/signatures | Block | Unassigned |
| Safeguarding | Unassigned | `SAFEGUARD-001` | No lead/deputy/cover | Block | Unassigned |
| Accessibility | Unassigned | Automated tests; manual plan | Required manual/device/lived-experience evidence absent | Block | Unassigned |
| Legal and housing content | Unassigned | Existing controlled sources | Human legal/editorial review incomplete | Block | Unassigned |
| Service and council verification | Unassigned | Dataset `v1.0.1` technical audit | Pre-pilot human reverification incomplete | Block | Unassigned |
| Infrastructure, monitoring and alerts | Unassigned | Local build only | No staging/hosted monitoring | Block | Unassigned |
| Backup, restore and rollback | Unassigned | Isolated logical proof | No provider PITR/object restore/traffic rollback | Block | Unassigned |
| Authentication and encryption | Unassigned | Local implementation/tests | Providers, KMS and rotation absent | Block | Unassigned |
| Evidence storage | Unassigned | Metadata-only gate | File path disabled/unimplemented | Disabled | Unassigned |
| External mail/notifications | Unassigned | Closed-by-default guard | Provider/testing absent | Disabled | Unassigned |
| Case/advocate/consent permissions | Unassigned | Phase 3/4 synthetic tests | Independent HTTP review pending | Block real data | Unassigned |
| Retention/deletion | Unassigned | Draft schema/policy | Workers and approved periods absent | Block real data | Unassigned |
| Incident response/support capacity | Unassigned | Phase 5 template only | No team/rota/exercise | Block | Unassigned |
| Insurance and organisational responsibility | Unassigned | None | Controller/operator not established | Block | Unassigned |
| Partner readiness and training | Unassigned | None | No approved partners/accounts/training | Block | Unassigned |

Before any release, record backup-before-migration, migration/dataset/gate checks, smoke/emergency/auth/access/revocation/safe-exit/discreet-mode tests, monitoring/alert verification, named release/rollback/safeguarding owners and release notes. Do not combine launch with a major migration, identity-provider change, key rotation or dataset overhaul.
