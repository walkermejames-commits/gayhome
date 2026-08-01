import { resolveTriage, triageInputSchema } from "@/domain/triage";
import { getCatalog } from "@/server/catalog";
import { apiError, publicNoStoreHeaders, validationError } from "@/server/http";

const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request): Promise<Response> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return apiError(413, "PAYLOAD_TOO_LARGE", "The triage request is too large.");
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(400, "INVALID_JSON", "The request body must be valid JSON.");
  }
  const parsed = triageInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const catalog = await getCatalog();
  const recommendations = resolveTriage(catalog, parsed.data);
  return Response.json({ data: recommendations, meta: { deterministic: true, datasetVersion: catalog.metadata.version } }, { headers: publicNoStoreHeaders });
}
