import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import EmbeddedPostgres from "embedded-postgres";
import { importJsonSeed } from "../src/domain/import/json-importer";
import { canonicalRecordsEqual, reconcileCatalogs } from "../src/domain/import/reconciliation";
import { seedCatalog } from "../src/server/db/seed-catalog";
import { stableUuid } from "../src/server/db/identifiers";
import { applyMigrations, migrationStatus } from "./lib/database.mjs";
import { createLogicalBackup, restoreLogicalBackup } from "./lib/logical-backup.mjs";

console.log("Starting isolated PostgreSQL deployment proof...");

const port = await new Promise<number>((resolve, reject) => {
  const server = net.createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") return reject(new Error("Could not allocate a test port."));
    server.close((error) => error ? reject(error) : resolve(address.port));
  });
});
const password = "local-deployment-proof-only";
const databaseDir = await fs.mkdtemp(path.join(os.tmpdir(), "kent-navigator-postgres-"));
const postgres = new EmbeddedPostgres({ databaseDir, user: "postgres", password, port, persistent: false, onLog: () => {}, onError: (message) => { if (!String(message).includes("LOG:")) process.stderr.write(`${String(message)}\n`); } });
const artifactDir = path.join(process.cwd(), "artifacts", "phase2");
const seedPath = path.join(process.cwd(), "data", "revisions", "v1.0.1", "kent_lgbtq_homelessness_resource_seed.json");
let client;
const keepAlive = setInterval(() => {}, 1_000);

try {
  await postgres.initialise();
  await postgres.start();
  client = postgres.getPgClient();
  await client.connect();
  const migrationResult = await applyMigrations(client);
  const integrationMigrations = ["0003_phase3_casework.sql", "0004_phase4_access_hardening.sql", "0005_phase5_pilot_operations.sql", "0006_phase6_platform_expansion.sql"];
  const baselineMigrationCount = (await client.query("SELECT count(*)::int AS count FROM schema_migrations WHERE filename <> ALL($1::text[])", [integrationMigrations])).rows[0]?.count;
  const phase6DownSql = await fs.readFile(path.join(process.cwd(), "migrations", "down", "0006_phase6_platform_expansion.down.sql"), "utf8");
  const phase5DownSql = await fs.readFile(path.join(process.cwd(), "migrations", "down", "0005_phase5_pilot_operations.down.sql"), "utf8");
  const phase4DownSql = await fs.readFile(path.join(process.cwd(), "migrations", "down", "0004_phase4_access_hardening.down.sql"), "utf8");
  const phase3DownSql = await fs.readFile(path.join(process.cwd(), "migrations", "down", "0003_phase3_casework.down.sql"), "utf8");
  await client.query(phase6DownSql);
  const phase6RolledBack = (await client.query("SELECT to_regclass('public.regions') IS NULL AS removed")).rows[0]?.removed === true;
  await client.query(phase5DownSql);
  await client.query(phase4DownSql);
  await client.query(phase3DownSql);
  await client.query("DELETE FROM schema_migrations WHERE filename = ANY($1::text[])", [integrationMigrations]);
  const rolledBack = (await client.query("SELECT to_regclass('public.cases') IS NULL AS removed")).rows[0]?.removed === true;
  const preservedBaselineMigrations = (await client.query("SELECT count(*)::int AS count FROM schema_migrations")).rows[0]?.count === baselineMigrationCount;
  const seedBytes = await fs.readFile(seedPath);
  const envelope = importJsonSeed(seedBytes, path.basename(seedPath));
  const firstSeed = await seedCatalog(client, envelope);
  const preUpgradeCounts = (await client.query("SELECT (SELECT count(*)::int FROM services) services, (SELECT count(*)::int FROM councils) councils, (SELECT count(*)::int FROM dataset_revisions) revisions")).rows[0];
  const reappliedMigrations = await applyMigrations(client);
  const reapplied = integrationMigrations.every((filename) => reappliedMigrations.find((item) => item.filename === filename)?.state === "applied");
  const phase6Flags = (await client.query("SELECT count(*)::int AS total, count(*) FILTER (WHERE default_state)::int AS enabled FROM phase6_feature_flags")).rows[0];
  const phase6DefaultDisabled = phase6Flags?.total === 10 && phase6Flags?.enabled === 0;
  const postUpgradeCounts = (await client.query("SELECT (SELECT count(*)::int FROM services) services, (SELECT count(*)::int FROM councils) councils, (SELECT count(*)::int FROM dataset_revisions) revisions")).rows[0];
  const existingDataSurvived = JSON.stringify(preUpgradeCounts) === JSON.stringify(postUpgradeCounts);
  const secondSeed = await seedCatalog(client, envelope);

  process.env.DATABASE_URL = `postgresql://postgres:${password}@127.0.0.1:${port}/postgres`;
  process.env.DATABASE_SSL_MODE = "disable";
  process.env.APP_ENV = "test";
  const { PostgresCatalogRepository } = await import("../src/server/repository/postgres-catalog-repository");
  const { closePool } = await import("../src/server/db/pool");
  const repository = new PostgresCatalogRepository();
  const databaseCatalog = await repository.getCatalog();
  const databaseHealth = await repository.getHealth();
  const canonicalParity = canonicalRecordsEqual(envelope.catalog, databaseCatalog);

  const profileId = stableUuid("deployment-proof-profile");
  await client.query("INSERT INTO profiles (id, session_mode) VALUES ($1, 'guest')", [profileId]);
  const backup = await createLogicalBackup(client);
  const preRestore = await client.query("SELECT count(*)::int AS count FROM services");
  await client.query("DELETE FROM services WHERE external_id = (SELECT external_id FROM services ORDER BY external_id LIMIT 1)");
  await client.query("DELETE FROM profiles WHERE id = $1", [profileId]);
  await restoreLogicalBackup(client, backup);
  const postRestore = await client.query("SELECT count(*)::int AS count FROM services");
  const restoredProfile = await client.query("SELECT count(*)::int AS count FROM profiles WHERE id = $1", [profileId]);

  const conflictingEnvelope = { ...envelope, fileSha256: "F".repeat(64), fileName: "controlled-conflict-proof.json" };
  const conflict = await seedCatalog(client, conflictingEnvelope);
  const conflictRows = await client.query("SELECT count(*)::int AS count FROM reconciliation_items WHERE import_id = $1", [conflict.importId]);
  const finalMigrations = await migrationStatus(client);
  const result = {
    generatedAt: new Date().toISOString(),
    engine: "PostgreSQL 18 embedded test cluster",
    migrations: finalMigrations,
    firstSeed,
    secondSeed,
    canonicalParity,
    databaseHealth,
    canonicalDifferences: canonicalParity ? [] : reconcileCatalogs(envelope.catalog, databaseCatalog).slice(0, 20),
    migrationLifecycle: { rolledBack, phase6RolledBack, preservedBaselineMigrations, phase2SeededBeforeUpgrade: firstSeed.status === "published", existingDataSurvived, preUpgradeCounts, postUpgradeCounts, reapplied },
    featureFlags: { phase6: phase6Flags, allDefaultsDisabled: phase6DefaultDisabled },
    backup: { format: backup.format, tableCount: Object.keys(backup.tables).length, phase3Included: Object.hasOwn(backup.tables, "cases") && Object.hasOwn(backup.tables, "case_access_permissions"), phase5Included: Object.hasOwn(backup.tables, "pilot_programs") && Object.hasOwn(backup.tables, "operational_release_gates"), phase6Included: Object.hasOwn(backup.tables, "regions") && Object.hasOwn(backup.tables, "phase6_feature_flags") },
    restore: { serviceCountBefore: preRestore.rows[0]?.count, serviceCountAfter: postRestore.rows[0]?.count, profileRestored: restoredProfile.rows[0]?.count === 1 },
    conflictingImport: { status: conflict.status, reconciliationItems: conflictRows.rows[0]?.count },
    passed: migrationResult.every((item) => item.state === "applied") && rolledBack && phase6RolledBack && preservedBaselineMigrations && existingDataSurvived && reapplied && phase6DefaultDisabled && Object.hasOwn(backup.tables, "cases") && Object.hasOwn(backup.tables, "pilot_programs") && Object.hasOwn(backup.tables, "regions") && firstSeed.status === "published" && secondSeed.status === "idempotent" && canonicalParity && databaseHealth.connected && databaseHealth.migrationCurrent && databaseHealth.integrityPassed && preRestore.rows[0]?.count === postRestore.rows[0]?.count && restoredProfile.rows[0]?.count === 1 && conflict.status === "review_required" && conflictRows.rows[0]?.count === 1,
  };
  await fs.mkdir(artifactDir, { recursive: true });
  await fs.writeFile(path.join(artifactDir, "deploy-001-restore-report.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
  console.log("Closing application database pool...");
  await closePool();
  console.log("Application database pool closed.");
  if (!result.passed) throw new Error("PostgreSQL deployment proof failed; inspect the generated report.");
} finally {
  console.log("Stopping isolated PostgreSQL deployment proof...");
  if (client) await client.end().catch(() => {});
  await postgres.stop().catch(() => {});
  if (path.resolve(databaseDir).startsWith(path.resolve(os.tmpdir(), "kent-navigator-postgres-"))) await fs.rm(databaseDir, { recursive: true, force: true }).catch(() => {});
  clearInterval(keepAlive);
  console.log("Isolated PostgreSQL deployment proof stopped.");
}
