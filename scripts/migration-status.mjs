import { migrationStatus, withClient } from "./lib/database.mjs";

const status = await withClient((client) => migrationStatus(client));
console.log(JSON.stringify({ migrations: status, current: status.every((item) => item.state === "applied") }, null, 2));
if (status.some((item) => item.state !== "applied")) process.exitCode = 1;
