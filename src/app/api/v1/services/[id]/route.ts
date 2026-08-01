import { getCatalog } from "@/server/catalog";
import { apiError, publicNoStoreHeaders } from "@/server/http";
import { publicContacts } from "@/domain/triage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  if (!/^srv_[a-z0-9_]+$/i.test(id)) return apiError(400, "INVALID_ID", "The service identifier is invalid.");
  const catalog = await getCatalog();
  const service = catalog.services.find((item) => item.id === id && item.status === "verified");
  if (!service) return apiError(404, "NOT_FOUND", "The service was not found.");
  const source = catalog.sources.find((item) => item.source_id === service.sourceId);
  return Response.json({ data: { ...service, contacts: publicContacts(service, new Date().toISOString().slice(0, 10)), source } }, { headers: publicNoStoreHeaders });
}
