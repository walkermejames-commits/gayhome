import { getCatalog } from "@/server/catalog";
import { apiError, publicNoStoreHeaders } from "@/server/http";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  if (!/^council_[a-z0-9_]+$/i.test(id)) return apiError(400, "INVALID_ID", "The council identifier is invalid.");
  const catalog = await getCatalog();
  const council = catalog.councils.find((item) => item.id === id && item.status === "verified");
  if (!council) return apiError(404, "NOT_FOUND", "The council was not found.");
  const source = catalog.sources.find((item) => item.source_id === council.sourceId);
  return Response.json({ data: { ...council, source } }, { headers: publicNoStoreHeaders });
}
