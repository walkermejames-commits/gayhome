import pg from "pg";
import { getEnvironment, requireDatabaseEnvironment } from "@/server/env";

let pool: pg.Pool | undefined;

function sslConfiguration(mode: ReturnType<typeof getEnvironment>["DATABASE_SSL_MODE"]): pg.PoolConfig["ssl"] {
  if (mode === "disable" || mode === "prefer") return undefined;
  if (mode === "require") return { rejectUnauthorized: false };
  return { rejectUnauthorized: true };
}

export function getPool(): pg.Pool {
  if (pool) return pool;
  const environment = requireDatabaseEnvironment();
  pool = new pg.Pool({
    connectionString: environment.DATABASE_URL,
    ssl: sslConfiguration(environment.DATABASE_SSL_MODE),
    max: environment.DATABASE_POOL_MAX,
    connectionTimeoutMillis: environment.DATABASE_CONNECT_TIMEOUT_MS,
    idleTimeoutMillis: 30_000,
    application_name: "kent-housing-navigator",
  });
  pool.on("error", () => {
    // Pool errors are intentionally not logged with connection or query data.
  });
  return pool;
}

export async function closePool(): Promise<void> {
  if (!pool) return;
  const current = pool;
  pool = undefined;
  await current.end();
}
