import { getCatalog } from "@/server/catalog";
import { verificationQueue } from "@/domain/verification";
import { publicNoStoreHeaders } from "@/server/http";

export async function GET(): Promise<Response> {
  const catalog = await getCatalog();
  const queue = verificationQueue(catalog, new Date().toISOString().slice(0, 10));
  return Response.json({
    data: {
      version: catalog.metadata.version,
      verifiedOn: catalog.metadata.verifiedOn,
      counts: { services: catalog.services.length, councils: catalog.councils.length, triageRoutes: catalog.triageRoutes.length, scripts: catalog.scripts.length, evidence: catalog.evidenceChecklist.length, sources: catalog.sources.length },
      dueSoon: queue.filter((item) => item.state === "due_soon"),
      overdue: queue.filter((item) => item.state === "overdue"),
    },
  }, { headers: publicNoStoreHeaders });
}
