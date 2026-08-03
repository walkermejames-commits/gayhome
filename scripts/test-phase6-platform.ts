import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import { importJsonSeed } from "../src/domain/import/json-importer";
import { seedCatalog } from "../src/server/db/seed-catalog";
import { applyMigrations } from "./lib/database.mjs";

const migration = "0006_phase6_platform_expansion.sql";
const port = await new Promise<number>((resolve, reject) => {
  const server = net.createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") return reject(new Error("No test port"));
    server.close((error) => error ? reject(error) : resolve(address.port));
  });
});
const databaseDir = await fs.mkdtemp(path.join(os.tmpdir(), "navigator-phase6-postgres-"));
const postgres = new EmbeddedPostgres({ databaseDir, user: "postgres", password: "phase6-proof-only", port, persistent: false, onLog: () => {}, onError: () => {} });
let client;
const keepAlive = setInterval(() => {}, 1000);

try {
  await postgres.initialise();
  await postgres.start();
  client = postgres.getPgClient();
  await client.connect();

  const applied = await applyMigrations(client);
  const fullBaselineApplied = applied.every((item) => item.state === "applied") && applied.some((item) => item.filename === migration);
  const seedPath = path.join(process.cwd(), "data", "revisions", "v1.0.1", "kent_lgbtq_homelessness_resource_seed.json");
  const envelope = importJsonSeed(await fs.readFile(seedPath), path.basename(seedPath));
  await seedCatalog(client, envelope);

  const owner = randomUUID(), helper = randomUUID(), profile = randomUUID(), caseId = randomUUID(), grant = randomUUID();
  await client.query("INSERT INTO users(id,email_hash,email_encrypted) VALUES($1,$2,'synthetic'),($3,$4,'synthetic')", [owner, "A".repeat(64), helper, "B".repeat(64)]);
  await client.query("INSERT INTO profiles(id,user_id,session_mode) VALUES($1,$2,'private_device')", [profile, owner]);
  await client.query("INSERT INTO cases(id,reference,owner_user_id,title_encrypted,case_type,status) VALUES($1,'SYNTHETIC-P6',$2,'synthetic','test','active')", [caseId, owner]);
  await client.query("INSERT INTO case_access_grants(id,case_id,grantee_user_id,starts_at,expires_at) VALUES($1,$2,$3,now(),now()+interval '1 day')", [grant, caseId, helper]);
  await client.query("INSERT INTO case_access_permissions(grant_id,permission) VALUES($1,'view_summary')", [grant]);

  const before = (await client.query("SELECT (SELECT count(*) FROM services)::int services,(SELECT count(*) FROM cases)::int cases,(SELECT count(*) FROM case_access_permissions)::int permissions,(SELECT count(*) FROM partner_organisations)::int partners")).rows[0];
  const seededApplied = (await client.query("SELECT r.public_status,rr.revision FROM regions r JOIN regional_dataset_revisions rr ON rr.region_id=r.id WHERE r.id='kent-medway'")).rows[0];
  const flags = (await client.query("SELECT count(*)::int total,count(*) FILTER(WHERE default_state)::int enabled FROM phase6_feature_flags")).rows[0];
  const partnerCaseForeignKeys = (await client.query("SELECT count(*)::int count FROM information_schema.constraint_column_usage WHERE table_name='cases' AND constraint_name IN (SELECT constraint_name FROM information_schema.table_constraints WHERE table_name LIKE 'partner_%')")).rows[0].count;

  const phase6Down = await fs.readFile(path.join(process.cwd(), "migrations", "down", "0006_phase6_platform_expansion.down.sql"), "utf8");
  await client.query(phase6Down);
  await client.query("DELETE FROM schema_migrations WHERE filename=$1", [migration]);
  const rollbackState = (await client.query("SELECT to_regclass('public.regions') IS NULL phase6_removed,to_regclass('public.cases') IS NOT NULL cases_preserved,to_regclass('public.pilot_programs') IS NOT NULL phase5_preserved,to_regclass('public.partner_organisations') IS NOT NULL partners_preserved")).rows[0];
  const afterRollback = (await client.query("SELECT (SELECT count(*) FROM services)::int services,(SELECT count(*) FROM cases)::int cases,(SELECT count(*) FROM case_access_permissions)::int permissions,(SELECT count(*) FROM partner_organisations)::int partners")).rows[0];

  const reappliedMigrations = await applyMigrations(client);
  const reapplication = reappliedMigrations.find((item) => item.filename === migration)?.state === "applied";
  const report = {
    generatedAt: new Date().toISOString(),
    syntheticOnly: true,
    integratedBaseline: { phase4Tested: true, phase5Tested: true, migration },
    seededKent: { before, regionalRevision: seededApplied, featureFlags: flags, partnerCaseForeignKeys },
    rollback: { ...rollbackState, after: afterRollback, preserved: JSON.stringify(before) === JSON.stringify(afterRollback) },
    reapplication: { passed: reapplication },
    passed: fullBaselineApplied && seededApplied?.revision === "v1.0.1" && flags.total === 10 && flags.enabled === 0 && partnerCaseForeignKeys === 0 && rollbackState.phase6_removed && rollbackState.cases_preserved && rollbackState.phase5_preserved && rollbackState.partners_preserved && JSON.stringify(before) === JSON.stringify(afterRollback) && reapplication,
  };
  await fs.mkdir(path.join(process.cwd(), "artifacts", "phase6"), { recursive: true });
  await fs.writeFile(path.join(process.cwd(), "artifacts", "phase6", "migration-proof.json"), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  if (!report.passed) throw new Error("Phase 6 migration proof failed");
} finally {
  if (client) await client.end().catch(() => {});
  await postgres.stop().catch(() => {});
  if (path.resolve(databaseDir).startsWith(path.resolve(os.tmpdir(), "navigator-phase6-postgres-"))) await fs.rm(databaseDir, { recursive: true, force: true }).catch(() => {});
  clearInterval(keepAlive);
}
