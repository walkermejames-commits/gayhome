import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { importJsonSeed } from "../src/domain/import/json-importer";
import { seedCatalog } from "../src/server/db/seed-catalog";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");
const filePath = path.join(process.cwd(), "data", "revisions", "v1.0.1", "kent_lgbtq_homelessness_resource_seed.json");
const envelope = importJsonSeed(await fs.readFile(filePath), path.basename(filePath));
const sslMode = process.env.DATABASE_SSL_MODE ?? "disable";
const client = new pg.Client({ connectionString: databaseUrl, ssl: sslMode === "verify-full" ? { rejectUnauthorized: true } : sslMode === "require" ? { rejectUnauthorized: false } : undefined, connectionTimeoutMillis: 5_000 });
await client.connect();
try { console.log(JSON.stringify(await seedCatalog(client, envelope), null, 2)); } finally { await client.end(); }
