import "server-only";
import { currentSession } from "@/server/auth-cookie";
import { getPool } from "@/server/db/pool";

export type Phase6AdminRole = "administrator" | "data_steward" | "commissioner" | "regional_reviewer";
export async function requirePhase6Admin(roles: readonly Phase6AdminRole[]) {
  const session = await currentSession();
  if (!session) return null;
  const result = await getPool().query<{ role: Phase6AdminRole }>("SELECT role FROM (SELECT role,expires_at,status FROM professional_roles WHERE user_id=$1 AND role='administrator' UNION ALL SELECT role,expires_at,status FROM phase6_staff_roles WHERE user_id=$1) authorised WHERE status='active' AND role=ANY($2::text[]) AND (expires_at IS NULL OR expires_at>now()) LIMIT 1", [session.userId, roles]);
  return result.rowCount ? { ...session, role: result.rows[0]!.role } : null;
}

export async function requirePartnerUser(organisationId?: string) {
  const session = await currentSession();
  if (!session) return null;
  const values: unknown[] = [session.userId];
  const organisationClause = organisationId ? "AND pu.organisation_id=$2" : "";
  if (organisationId) values.push(organisationId);
  const result = await getPool().query<{ organisation_id: string; role: string }>(`SELECT pu.organisation_id,pu.role FROM partner_users pu JOIN partner_organisations po ON po.id=pu.organisation_id JOIN partner_agreements pa ON pa.organisation_id=po.id WHERE pu.user_id=$1 ${organisationClause} AND pu.status='active' AND po.status IN ('verified','limited') AND pa.status='active' AND (pa.expires_at IS NULL OR pa.expires_at>now()) LIMIT 1`, values);
  return result.rowCount ? { ...session, organisationId: result.rows[0]!.organisation_id, partnerRole: result.rows[0]!.role, caseAccess: false as const } : null;
}
