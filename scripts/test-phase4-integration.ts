import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { randomUUID } from "node:crypto";
import EmbeddedPostgres from "embedded-postgres";
import { applyMigrations } from "./lib/database.mjs";

const port = await new Promise<number>((resolve, reject) => {
  const server = net.createServer();
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => {
    const address = server.address();
    if (!address || typeof address === "string") return reject(new Error("No test port"));
    server.close((error) => error ? reject(error) : resolve(address.port));
  });
});

const databaseDir = await fs.mkdtemp(path.join(os.tmpdir(), "kent-phase4-integration-"));
const password = "phase4-integration-proof-only";
const postgres = new EmbeddedPostgres({
  databaseDir,
  user: "postgres",
  password,
  port,
  persistent: false,
  onLog: () => {},
  onError: () => {},
});
let client;
const keepAlive = setInterval(() => {}, 1_000);

try {
  await postgres.initialise();
  await postgres.start();
  client = postgres.getPgClient();
  await client.connect();
  await applyMigrations(client);

  process.env.DATABASE_URL = `postgresql://postgres:${password}@127.0.0.1:${port}/postgres`;
  process.env.DATABASE_SSL_MODE = "disable";
  process.env.APP_ENV = "test";
  process.env.SESSION_SECRET = "phase4-integration-session-secret-at-least-32-characters";
  process.env.ENCRYPTION_KEY_ID = "phase4-integration-key";
  process.env.ENCRYPTION_MASTER_KEY = Buffer.alloc(32, 9).toString("base64");

  const {
    acceptInvitation,
    addEvent,
    createCase,
    createInvitation,
    getCase,
    hashInvite,
    listCases,
    revokeConsent,
    updateCase,
  } = await import("../src/server/casework");
  const { closePool } = await import("../src/server/db/pool");

  const ownerId = randomUUID();
  const ownerProfileId = randomUUID();
  const advocateId = randomUUID();
  const advocateProfileId = randomUUID();
  await client.query(
    "INSERT INTO users(id,email_hash,email_encrypted) VALUES ($1,$2,'test'),($3,$4,'test')",
    [ownerId, hashInvite("email:owner@example.test"), advocateId, hashInvite("email:advocate@example.test")],
  );
  await client.query(
    "INSERT INTO profiles(id,user_id,session_mode) VALUES ($1,$2,'private_device'),($3,$4,'private_device')",
    [ownerProfileId, ownerId, advocateProfileId, advocateId],
  );

  const owner = { userId: ownerId, profileId: ownerProfileId, sessionId: randomUUID() };
  const advocate = { userId: advocateId, profileId: advocateProfileId, sessionId: randomUUID() };
  const created = await createCase(owner, {
    title: "Private integration case",
    caseType: "homelessness_application",
    urgency: "urgent",
    safeContact: true,
    discreetMode: false,
  });

  const addOnlyInvitation = await createInvitation(owner, {
    caseId: created.id,
    email: "advocate@example.test",
    helperType: "support worker",
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    permissions: ["add_notes"],
    sensitiveCategories: [],
  });
  await acceptInvitation(advocate, addOnlyInvitation!.inviteToken!);

  const hiddenWithoutSummary = (await listCases(advocate)).length === 0;
  const summaryDeniedWithoutPermission = (await getCase(advocate, created.id)) === null;
  const noteAllowed = Boolean(await addEvent(advocate, created.id, {
    eventAt: new Date().toISOString(),
    eventType: "advocate_action",
    description: "Synthetic access-boundary note",
    privacyClassification: "personal",
  }));

  const summaryInvitation = await createInvitation(owner, {
    caseId: created.id,
    email: "advocate@example.test",
    helperType: "support worker",
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    permissions: ["view_summary"],
    sensitiveCategories: [],
  });
  await acceptInvitation(advocate, summaryInvitation!.inviteToken!);

  const listed = await listCases(advocate);
  const visibleExactlyOnce = listed.length === 1 && listed[0]?.id === created.id;
  const summary = await getCase(advocate, created.id);
  const timelineStillWithheld = summary?.events.length === 0;

  const consentRows = await client.query<{ id: string }>(
    "SELECT consent_id id FROM advocate_invitations WHERE id=ANY($1::uuid[]) ORDER BY id",
    [[addOnlyInvitation!.id, summaryInvitation!.id]],
  );
  const bothRevoked = (await Promise.all(consentRows.rows.map((row) => revokeConsent(owner, row.id)))).every(Boolean);
  const hiddenAfterRevocation = (await listCases(advocate)).length === 0;

  const archivedInvitation = await createInvitation(owner, {
    caseId: created.id,
    email: "advocate@example.test",
    helperType: "support worker",
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    permissions: ["view_summary"],
    sensitiveCategories: [],
  });
  await acceptInvitation(advocate, archivedInvitation!.inviteToken!);
  const archivedThroughCaseUpdate = Boolean(await updateCase(owner, created.id, { status: "archived" }));
  const archivedHiddenFromList = (await listCases(advocate)).length === 0;
  const archivedAccessDenied = (await getCase(advocate, created.id)) === null;
  const archivedOwnerAccessDenied = (await getCase(owner, created.id)) === null;

  const report = {
    generatedAt: new Date().toISOString(),
    database: "PostgreSQL 18 isolated",
    syntheticOnly: true,
    hiddenWithoutSummary,
    summaryDeniedWithoutPermission,
    noteAllowed,
    visibleExactlyOnce,
    timelineStillWithheld,
    bothRevoked,
    hiddenAfterRevocation,
    archivedThroughCaseUpdate,
    archivedHiddenFromList,
    archivedAccessDenied,
    archivedOwnerAccessDenied,
  };
  const passed = Object.entries(report)
    .filter(([key]) => !["generatedAt", "database", "syntheticOnly"].includes(key))
    .every(([, value]) => value === true);
  console.log(JSON.stringify({ ...report, passed }, null, 2));
  await closePool();
  if (!passed) throw new Error("Phase 4 integration access-boundary proof failed");
} finally {
  if (client) await client.end().catch(() => {});
  await postgres.stop().catch(() => {});
  if (path.resolve(databaseDir).startsWith(path.resolve(os.tmpdir(), "kent-phase4-integration-"))) {
    await fs.rm(databaseDir, { recursive: true, force: true }).catch(() => {});
  }
  clearInterval(keepAlive);
}
