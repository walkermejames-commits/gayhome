# PostgreSQL backup, restore and recovery

Status: operational procedure verified on an isolated PostgreSQL test cluster on 2026-08-01. Production ownership is awaiting assignment.

## Deploy

Set `DATABASE_URL`, `DATABASE_SSL_MODE`, `APP_ENV`, `APP_BASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY_ID`, `ENCRYPTION_MASTER_KEY` and any approved object-storage values in the platform secret store. Run `pnpm db:status`, `pnpm db:migrate`, `pnpm db:seed`, then query `/api/v1/health`. Staging and production fail closed without PostgreSQL.

Create migrations with `pnpm db:generate`; apply with `pnpm db:migrate`; inspect with `pnpm db:status`. SQL migrations are forward-only. Rollback is supported only through a reviewed compensating migration or a tested restore. There is intentionally no production reset command.

## Backup

For hosted environments, use the provider's encrypted physical snapshots and point-in-time recovery. Before a release, take a provider snapshot and record its identifier outside the repository. Export the active dataset revision separately from the controlled `data/revisions` assets. Back up encrypted object storage with versioning and retention enabled.

The application-level restore proof uses `scripts/lib/logical-backup.mjs` against test data. Its latest evidence is `artifacts/phase2/deploy-001-restore-report.json`. It is a portability and verification layer, not a substitute for provider-native WAL/PITR.

## Restore verification

Restore into a new, isolated database; never overwrite the only production copy. Apply the recorded encryption keys through the secret store, run the migration status check, query the active revision, verify the six controlled collection counts and references, verify a synthetic profile record, and then run application health and smoke journeys. Record who authorised the recovery and when traffic was switched.

Encrypted values are unrecoverable without the matching key ID and key material. Keys must be backed up separately in an approved secrets system. A compromised key requires traffic isolation, incident response, key rotation by decrypt-and-re-encrypt, session revocation, assessment and notification under the approved breach process.
