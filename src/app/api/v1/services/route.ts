import { z } from "zod";
import { getCatalog } from "@/server/catalog";
import { apiError, publicNoStoreHeaders, validationError } from "@/server/http";
import { publicContacts } from "@/domain/triage";

const querySchema = z.object({
  urgency: z.enum(["low", "medium", "high", "critical"]).optional(),
  tag: z.string().trim().min(1).max(80).optional(),
  coverage: z.string().trim().min(1).max(120).optional(),
});

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return validationError(parsed.error);
  const catalog = await getCatalog();
  const asOf = new Date().toISOString().slice(0, 10);
  const services = catalog.services.filter((service) => service.status === "verified")
    .filter((service) => !parsed.data.urgency || service.urgency === parsed.data.urgency)
    .filter((service) => !parsed.data.tag || service.tags.some((tag) => tag.toLocaleLowerCase("en-GB") === parsed.data.tag?.toLocaleLowerCase("en-GB")))
    .filter((service) => !parsed.data.coverage || service.coverage.toLocaleLowerCase("en-GB").includes(parsed.data.coverage.toLocaleLowerCase("en-GB")))
    .map((service) => ({ ...service, contacts: publicContacts(service, asOf) }));
  if (services.length === 0 && url.searchParams.has("id")) return apiError(404, "NOT_FOUND", "No matching service was found.");
  return Response.json({ data: services, meta: { count: services.length, datasetVersion: catalog.metadata.version } }, { headers: publicNoStoreHeaders });
}
