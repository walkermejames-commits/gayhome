import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { authCookieName, consumeLoginLink } from "@/server/auth";
import { setAuthCookie } from "@/server/auth-cookie";
import { apiError, originIsTrusted, publicNoStoreHeaders, validationError } from "@/server/http";

const schema = z.object({ token: z.string().min(32).max(128) });
export async function POST(request: NextRequest) {
  if (!originIsTrusted(request)) return apiError(403, "ORIGIN_REJECTED", "The request origin is not trusted.");
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  try { const result = await consumeLoginLink(parsed.data.token, (await cookies()).get(authCookieName)?.value); await setAuthCookie(result.sessionId, result.expiresAt); return Response.json({ data: { signedIn: true, expiresAt: result.expiresAt } }, { headers: publicNoStoreHeaders }); }
  catch { return apiError(400, "LINK_INVALID", "This sign-in link is invalid or has expired."); }
}
