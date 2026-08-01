import { applyMigrations, withClient } from "./lib/database.mjs";

const status = await withClient((client) => applyMigrations(client));
console.log(JSON.stringify({ migrations: status, current: status.every((item) => item.state === "applied") }, null, 2));
