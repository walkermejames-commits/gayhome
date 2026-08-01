import { cookies } from "next/headers";
import { authCookieName, authenticatedSession } from "@/server/auth";

export async function currentSession() {
  const store = await cookies();
  return authenticatedSession(store.get(authCookieName)?.value);
}

export async function setAuthCookie(sessionId: string, expiresAt: Date) {
  const store = await cookies();
  store.set(authCookieName, sessionId, { httpOnly: true, secure: process.env.SESSION_COOKIE_SECURE === "true" || process.env.NODE_ENV === "production", sameSite: "lax", path: "/", expires: expiresAt });
}

export async function clearAuthCookie() { (await cookies()).delete(authCookieName); }
