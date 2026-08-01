import { getCatalogRepository } from "@/server/repository";

export async function GET() {
  const health = await getCatalogRepository().getHealth();
  const ok = health.connected && health.integrityPassed && (health.storage !== "postgresql" || health.migrationCurrent);
  return Response.json({ status: ok ? "ok" : "unavailable", database: health.storage === "postgresql" ? (health.connected ? "connected" : "unavailable") : "development-files", migrations: health.migrationCurrent ? "current" : "not-current", activeDataset: health.activeRevision, integrity: health.integrityPassed ? "passed" : "failed" }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
