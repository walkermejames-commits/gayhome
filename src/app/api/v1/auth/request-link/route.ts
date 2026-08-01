import type { NextRequest } from "next/server";
import { z } from "zod";
import { requestLoginLink } from "@/server/auth";
import { apiError, originIsTrusted, publicNoStoreHeaders, validationError } from "@/server/http";

const schema = z.object({ email: z.email().max(254) });
export async function POST(request: NextRequest) {
  if (!originIsTrusted(request)) return apiError(403, "ORIGIN_REJECTED", "The request origin is not trusted.");
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  try { return Response.json({ data: await requestLoginLink(parsed.data.email, request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown") }, { headers: publicNoStoreHeaders }); }
  catch { return apiError(503, "AUTH_UNAVAILABLE", "Account sign-in is temporarily unavailable. You can continue as a guest."); }
}
