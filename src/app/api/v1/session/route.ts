import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { sessionModePolicies } from "@/domain/profile";
import { apiError, originIsTrusted, publicNoStoreHeaders, validationError } from "@/server/http";

const requestSchema = z.object({ mode: z.enum(["guest", "private_device", "public_device"]) });
const cookieName = "navigator_session";
const modeCookieName = "navigator_mode";

export async function POST(request: NextRequest): Promise<Response> {
  if (!originIsTrusted(request)) return apiError(403, "ORIGIN_REJECTED", "The request origin is not trusted.");
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return validationError(parsed.error);
  const store = await cookies();
  const policy = sessionModePolicies[parsed.data.mode];
  if (parsed.data.mode === "guest") {
    store.delete(cookieName);
    store.delete(modeCookieName);
    return Response.json({ data: { mode: "guest", persistence: policy.persistence } }, { headers: publicNoStoreHeaders });
  }
  const secure = process.env.SESSION_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production";
  const options = { httpOnly: true, secure, sameSite: "lax" as const, path: "/", maxAge: policy.maxAgeMinutes * 60 };
  store.set(cookieName, randomUUID(), options);
  store.set(modeCookieName, parsed.data.mode, options);
  return Response.json({ data: { mode: parsed.data.mode, persistence: policy.persistence, expiresInMinutes: policy.maxAgeMinutes } }, { headers: publicNoStoreHeaders });
}

export async function GET(): Promise<Response> {
  const store = await cookies();
  const mode = store.get(modeCookieName)?.value ?? "guest";
  return Response.json({ data: { mode } }, { headers: publicNoStoreHeaders });
}

export async function DELETE(request: NextRequest): Promise<Response> {
  if (!originIsTrusted(request)) return apiError(403, "ORIGIN_REJECTED", "The request origin is not trusted.");
  const store = await cookies();
  store.delete(cookieName);
  store.delete(modeCookieName);
  return Response.json({ data: { mode: "guest" } }, { headers: publicNoStoreHeaders });
}
