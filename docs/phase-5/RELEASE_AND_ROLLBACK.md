# Release and rollback

Release records contain version, 40-character commit, dataset revision, migration level, environment, checklist, approver, release owner, rollback owner, notes, backup reference and rollback version.

`pnpm release:dry-run` is read-only. It reports branch/commit, false feature defaults and the required migration, dataset, gate, backup, rollback, smoke, emergency, authentication, access, safe-exit, discreet-mode and monitoring checks. It never deploys.

The API release preflight blocks missing owners, missing rollback version, incomplete checklist items and open gates. Production is explicitly unsupported. Rollback preparation requires a recorded rollback version and backup reference, changes the release record to `rollback_prepared`, and writes an audit event; it does not execute infrastructure changes.

Before any separately authorised staging release, create a provider-native backup, verify the restore target, run current migrations, smoke-test emergency routes and access controls, verify monitoring/alerts and record approvals. No release, rollback, merge or deployment was executed during Phase 5 implementation.
