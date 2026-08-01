import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";

export const publicNoStoreHeaders = { "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" };

export function apiError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status, headers: publicNoStoreHeaders });
}

export function validationError(error: z.ZodError): NextResponse {
  return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "The request was not valid.", fields: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })) } }, { status: 400, headers: publicNoStoreHeaders });
}

export function originIsTrusted(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const configured = process.env.APP_BASE_URL;
  const expected = configured ? new URL(configured).origin : request.nextUrl.origin;
  return origin === expected;
}
