import { z } from "zod";
import { getCatalog } from "@/server/catalog";
import { publicNoStoreHeaders, validationError } from "@/server/http";

const querySchema = z.object({ area: z.string().trim().min(1).max(120).optional() });

export async function GET(request: Request): Promise<Response> {
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);
  const catalog = await getCatalog();
  const councils = catalog.councils.filter((council) => council.status === "verified")
    .filter((council) => !parsed.data.area || council.area.toLocaleLowerCase("en-GB").includes(parsed.data.area.toLocaleLowerCase("en-GB")));
  return Response.json({ data: councils, meta: { count: councils.length, datasetVersion: catalog.metadata.version } }, { headers: publicNoStoreHeaders });
}
