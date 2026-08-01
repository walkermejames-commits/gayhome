import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

export function databaseConfig(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const mode = process.env.DATABASE_SSL_MODE ?? "disable";
  return { connectionString: databaseUrl, ssl: mode === "verify-full" ? { rejectUnauthorized: true } : mode === "require" ? { rejectUnauthorized: false } : undefined, connectionTimeoutMillis: 5_000, application_name: "kent-housing-navigator-tooling" };
}

export async function withClient(callback, databaseUrl = process.env.DATABASE_URL) {
  const client = new pg.Client(databaseConfig(databaseUrl));
  await client.connect();
  try { return await callback(client); } finally { await client.end(); }
}

export async function migrationFiles() {
  const directory = path.join(process.cwd(), "migrations");
  return (await fs.readdir(directory)).filter((name) => /^\d+.*\.sql$/.test(name)).sort().map((name) => ({ name, path: path.join(directory, name) }));
}

export async function migrationStatus(client) {
  await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, sha256 char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
  const applied = new Map((await client.query("SELECT filename, sha256 FROM schema_migrations ORDER BY filename")).rows.map((row) => [row.filename, row.sha256]));
  const files = await migrationFiles();
  const status = [];
  for (const file of files) {
    const bytes = await fs.readFile(file.path);
    const hash = crypto.createHash("sha256").update(bytes).digest("hex").toUpperCase();
    const recorded = applied.get(file.name);
    status.push({ filename: file.name, sha256: hash, state: recorded === undefined ? "pending" : recorded === hash ? "applied" : "drift" });
  }
  return status;
}

export async function applyMigrations(client) {
  const status = await migrationStatus(client);
  const drift = status.filter((item) => item.state === "drift");
  if (drift.length) throw new Error(`Migration drift detected: ${drift.map((item) => item.filename).join(", ")}`);
  for (const item of status.filter((entry) => entry.state === "pending")) {
    const sql = await fs.readFile(path.join(process.cwd(), "migrations", item.filename), "utf8");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (filename, sha256) VALUES ($1, $2)", [item.filename, item.sha256]);
  }
  return migrationStatus(client);
}

export function stableUuid(value) {
  const hex = crypto.createHash("sha256").update(`kent-navigator:${value}`).digest("hex").slice(0, 32).split("");
  hex[12] = "5";
  hex[16] = (8 + (parseInt(hex[16], 16) % 4)).toString(16);
  const joined = hex.join("");
  return `${joined.slice(0, 8)}-${joined.slice(8, 12)}-${joined.slice(12, 16)}-${joined.slice(16, 20)}-${joined.slice(20)}`;
}

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex").toUpperCase();
}
