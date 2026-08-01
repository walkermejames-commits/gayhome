import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { authCookieName, revokeSession } from "@/server/auth";
import { clearAuthCookie, currentSession } from "@/server/auth-cookie";
import { apiError, originIsTrusted, publicNoStoreHeaders } from "@/server/http";

export async function GET() { return Response.json({ data: { signedIn: Boolean(await currentSession()) } }, { headers: publicNoStoreHeaders }); }
export async function DELETE(request: NextRequest) {
  if (!originIsTrusted(request)) return apiError(403, "ORIGIN_REJECTED", "The request origin is not trusted.");
  const id = (await cookies()).get(authCookieName)?.value;
  if (id) await revokeSession(id, request.nextUrl.searchParams.get("all") === "true");
  await clearAuthCookie();
  return Response.json({ data: { signedIn: false } }, { headers: publicNoStoreHeaders });
}
