import { createHmac, randomBytes, randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { getPool } from "@/server/db/pool";
import { getEnvironment } from "@/server/env";
import { decryptSensitive, encryptSensitive } from "@/server/security/encryption";

export const authCookieName = "navigator_auth";
const genericMessage = "If that email can be used, a sign-in link will be sent.";
const normaliseEmail = (email: string) => email.trim().toLocaleLowerCase("en-GB");
const digest = (value: string) => createHmac("sha256", getEnvironment().SESSION_SECRET ?? "unconfigured").update(value).digest("hex");

async function audit(client: PoolClient, actorId: string | null, eventType: string, resourceType: string, resourceId: string | null, metadata: Record<string, unknown> = {}) {
  await client.query("INSERT INTO audit_events (id, actor_id, event_type, resource_type, resource_id, metadata) VALUES ($1,$2,$3,$4,$5,$6)", [randomUUID(), actorId, eventType, resourceType, resourceId, metadata]);
}

export async function requestLoginLink(emailInput: string, ip: string): Promise<{ message: string; testToken?: string }> {
  const environment = getEnvironment();
  if (!environment.DATABASE_URL || !environment.SESSION_SECRET || !environment.ENCRYPTION_KEY_ID || !environment.ENCRYPTION_MASTER_KEY) throw new Error("Account sign-in is unavailable.");
  const email = normaliseEmail(emailInput);
  const emailHash = digest(`email:${email}`);
  const rateKey = digest(`login:${emailHash}:${ip}`);
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const rate = await client.query<{ attempts: number; blocked_until: Date | null }>("SELECT attempts, blocked_until FROM auth_rate_limits WHERE key_hash = $1 FOR UPDATE", [rateKey]);
    if (rate.rows[0]?.blocked_until && rate.rows[0].blocked_until > new Date()) { await client.query("COMMIT"); return { message: genericMessage }; }
    const attempts = (rate.rows[0]?.attempts ?? 0) + 1;
    const blockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60_000) : null;
    await client.query("INSERT INTO auth_rate_limits (key_hash, window_started_at, attempts, blocked_until) VALUES ($1,now(),$2,$3) ON CONFLICT (key_hash) DO UPDATE SET attempts = CASE WHEN auth_rate_limits.window_started_at < now() - interval '15 minutes' THEN 1 ELSE $2 END, window_started_at = CASE WHEN auth_rate_limits.window_started_at < now() - interval '15 minutes' THEN now() ELSE auth_rate_limits.window_started_at END, blocked_until = $3", [rateKey, attempts, blockedUntil]);
    if (blockedUntil) { await audit(client, null, "auth.rate_limited", "authentication", null); await client.query("COMMIT"); return { message: genericMessage }; }
    const userId = randomUUID();
    const encryptedEmail = encryptSensitive(email, `user-email:${emailHash}`);
    const user = await client.query<{ id: string }>("INSERT INTO users (id,email_hash,email_encrypted) VALUES ($1,$2,$3) ON CONFLICT (email_hash) DO UPDATE SET updated_at = now() RETURNING id", [userId, emailHash, encryptedEmail]);
    const token = randomBytes(32).toString("base64url");
    const linkId = randomUUID();
    await client.query("INSERT INTO login_links (id,user_id,token_hash,expires_at,request_event_id,requested_ip_hash) VALUES ($1,$2,$3,now() + interval '15 minutes',$4,$5)", [linkId, user.rows[0]!.id, digest(`link:${token}`), randomUUID(), digest(`ip:${ip}`)]);
    await audit(client, user.rows[0]!.id, "auth.link_requested", "login_link", linkId);
    await client.query("COMMIT");
    if (environment.AUTH_TEST_MODE === "true" && (environment.APP_ENV === "development" || environment.APP_ENV === "test")) return { message: genericMessage, testToken: token };
    // An approved transactional-email adapter must deliver the token. Tokens are never logged.
    return { message: genericMessage };
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; } finally { client.release(); }
}

export async function consumeLoginLink(token: string, previousSessionId?: string): Promise<{ sessionId: string; expiresAt: Date }> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const link = await client.query<{ id: string; user_id: string }>("SELECT id,user_id FROM login_links WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now() FOR UPDATE", [digest(`link:${token}`)]);
    if (!link.rowCount) throw new Error("This sign-in link is invalid or has expired.");
    await client.query("UPDATE login_links SET consumed_at = now() WHERE id = $1", [link.rows[0]!.id]);
    let profile = await client.query<{ id: string }>("SELECT id FROM profiles WHERE user_id = $1 ORDER BY created_at LIMIT 1", [link.rows[0]!.user_id]);
    if (!profile.rowCount) profile = await client.query("INSERT INTO profiles (id,user_id,session_mode) VALUES ($1,$2,'private_device') RETURNING id", [randomUUID(), link.rows[0]!.user_id]);
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000);
    const rotatedFrom = previousSessionId && /^[0-9a-f-]{36}$/i.test(previousSessionId) ? previousSessionId : null;
    if (rotatedFrom) await client.query("UPDATE sessions SET revoked_at = now() WHERE id = $1", [rotatedFrom]);
    await client.query("INSERT INTO sessions (id,user_id,profile_id,mode,expires_at,rotated_from) VALUES ($1,$2,$3,'private_device',$4,$5)", [sessionId, link.rows[0]!.user_id, profile.rows[0]!.id, expiresAt, rotatedFrom]);
    await client.query("UPDATE users SET email_verified_at = COALESCE(email_verified_at,now()), updated_at = now() WHERE id = $1", [link.rows[0]!.user_id]);
    await audit(client, link.rows[0]!.user_id, "auth.signed_in", "session", sessionId);
    await client.query("COMMIT");
    return { sessionId, expiresAt };
  } catch (error) { await client.query("ROLLBACK").catch(() => {}); throw error; } finally { client.release(); }
}

export async function authenticatedSession(sessionId?: string): Promise<{ userId: string; profileId: string; sessionId: string } | null> {
  if (!sessionId || !/^[0-9a-f-]{36}$/i.test(sessionId)) return null;
  const result = await getPool().query<{ user_id: string; profile_id: string; id: string }>("SELECT s.id,s.user_id,s.profile_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=$1 AND s.revoked_at IS NULL AND s.expires_at > now() AND u.disabled_at IS NULL", [sessionId]);
  return result.rowCount ? { userId: result.rows[0]!.user_id, profileId: result.rows[0]!.profile_id, sessionId: result.rows[0]!.id } : null;
}

export async function revokeSession(sessionId: string, all = false): Promise<void> {
  const session = await authenticatedSession(sessionId);
  if (!session) return;
  await getPool().query(all ? "UPDATE sessions SET revoked_at=now() WHERE user_id=$1 AND revoked_at IS NULL" : "UPDATE sessions SET revoked_at=now() WHERE id=$1", [all ? session.userId : session.sessionId]);
}

export async function exportAccount(sessionId: string) {
  const session = await authenticatedSession(sessionId); if (!session) return null;
  const user = await getPool().query<{email_hash:string;email_encrypted:string;created_at:Date;email_verified_at:Date|null}>("SELECT email_hash,email_encrypted,created_at,email_verified_at FROM users WHERE id=$1",[session.userId]);
  const facts = await getPool().query<{semantic_key:string;value_encrypted:string;provenance:unknown;updated_at:Date;expires_at:Date|null;excluded_from_autofill:boolean;sharing_restricted:boolean}>("SELECT d.semantic_key,f.value_encrypted,f.provenance,f.updated_at,f.expires_at,f.excluded_from_autofill,f.sharing_restricted FROM profile_facts f JOIN field_definitions d ON d.id=f.field_definition_id WHERE f.profile_id=$1 AND f.superseded_at IS NULL",[session.profileId]);
  return { account:{email:decryptSensitive(user.rows[0]!.email_encrypted,`user-email:${user.rows[0]!.email_hash}`),createdAt:user.rows[0]!.created_at,emailVerifiedAt:user.rows[0]!.email_verified_at},profileFacts:facts.rows.map(f=>({field:f.semantic_key,value:decryptSensitive(f.value_encrypted,`profile-fact:${session.profileId}:${f.semantic_key}`),provenance:f.provenance,updatedAt:f.updated_at,expiresAt:f.expires_at,excludedFromAutofill:f.excluded_from_autofill,sharingRestricted:f.sharing_restricted})) };
}

export async function requestAccountDeletion(sessionId:string){const session=await authenticatedSession(sessionId);if(!session)return null;const id=randomUUID(),dueAt=new Date(Date.now()+30*86_400_000),client=await getPool().connect();try{await client.query("BEGIN");await client.query("INSERT INTO account_deletion_requests (id,user_id,requested_at,due_at,retention_exceptions) VALUES ($1,$2,now(),$3,$4)",[id,session.userId,dueAt,["Security and legal records may be retained only where required and will be disclosed."]]);await client.query("UPDATE users SET deletion_due_at=$1 WHERE id=$2",[dueAt,session.userId]);await client.query("UPDATE sessions SET revoked_at=now() WHERE user_id=$1",[session.userId]);await client.query("COMMIT");return{id,dueAt};}catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}}
