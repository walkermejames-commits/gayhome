import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import type { ZodType } from "zod";
import { authCookieName, authenticatedSession } from "@/server/auth";
import { getPool } from "@/server/db/pool";
import { getEnvironment } from "@/server/env";
import { apiError, originIsTrusted, validationError } from "@/server/http";

export async function apiSession(request:NextRequest){return authenticatedSession(request.cookies.get(authCookieName)?.value)}
export async function requireApiSession(request:NextRequest){const session=await apiSession(request);return session??apiError(401,"AUTH_REQUIRED","Sign in to use secure casework.")}
export async function requireMutation(request:NextRequest){if(!originIsTrusted(request))return apiError(403,"ORIGIN_REJECTED","The request origin is not trusted.");return requireApiSession(request)}
export async function parseJson<T>(request:NextRequest,schema:ZodType<T>){let body:unknown;try{body=await request.json()}catch{return apiError(400,"INVALID_JSON","The request body must be valid JSON.")}const parsed=schema.safeParse(body);return parsed.success?parsed.data:validationError(parsed.error)}
export async function caseRateLimit(userId:string,scope:string,limit=120){const env=getEnvironment(),bucket=Math.floor(Date.now()/60_000),key=createHmac("sha256",env.SESSION_SECRET??"unconfigured").update(`case-api:${userId}:${scope}:${bucket}`).digest("hex");const result=await getPool().query<{attempts:number}>("INSERT INTO auth_rate_limits (key_hash,window_started_at,attempts) VALUES ($1,now(),1) ON CONFLICT(key_hash) DO UPDATE SET attempts=auth_rate_limits.attempts+1 RETURNING attempts",[key]);return result.rows[0]!.attempts<=limit}
export function unexpectedApiError(){return apiError(500,"INTERNAL_ERROR","The request could not be completed safely.")}
