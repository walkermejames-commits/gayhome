import "server-only";

import type { NextRequest } from "next/server";
import { apiSession, requireMutation } from "@/server/case-api";
import { getPool } from "@/server/db/pool";
import { apiError } from "@/server/http";

export const operationalRoles = ["pilot_administrator", "support_agent", "incident_commander", "safeguarding_lead", "data_reviewer", "partner_administrator", "release_manager", "commissioner_viewer"] as const;
export type OperationalRole = (typeof operationalRoles)[number];

export type OperationalActor = { userId: string; profileId: string; sessionId: string; roles: OperationalRole[]; administrator: boolean };

async function actorFor(request: NextRequest, mutation: boolean): Promise<OperationalActor | ReturnType<typeof apiError>> {
  const sessionOrResponse = mutation ? await requireMutation(request) : await apiSession(request);
  if (!sessionOrResponse || sessionOrResponse instanceof Response) return sessionOrResponse || apiError(401, "AUTH_REQUIRED", "Sign in to use operational tools.");
  const [admin, roles] = await Promise.all([
    getPool().query("SELECT 1 FROM professional_roles WHERE user_id=$1 AND role='administrator' AND status='active' AND (expires_at IS NULL OR expires_at>now())", [sessionOrResponse.userId]),
    getPool().query<{ role: OperationalRole }>("SELECT role FROM operational_role_assignments WHERE user_id=$1 AND status='active' AND (expires_at IS NULL OR expires_at>now())", [sessionOrResponse.userId]),
  ]);
  return { ...sessionOrResponse, administrator: Boolean(admin.rowCount), roles: roles.rows.map((row) => row.role) };
}

export async function requireOperationalActor(request: NextRequest, allowed: readonly OperationalRole[], mutation = false): Promise<OperationalActor | Response> {
  const actor = await actorFor(request, mutation);
  if (actor instanceof Response) return actor;
  if (!actor.administrator && !actor.roles.some((role) => allowed.includes(role))) return apiError(403, "OPERATIONAL_ROLE_REQUIRED", "Your active role does not permit this operational action.");
  return actor;
}

export async function assertPilotScope(actor: OperationalActor, pilotId: string): Promise<boolean> {
  if (actor.administrator) return true;
  const result = await getPool().query("SELECT 1 FROM operational_role_assignments WHERE user_id=$1 AND pilot_id=$2 AND status='active' AND (expires_at IS NULL OR expires_at>now())", [actor.userId, pilotId]);
  return Boolean(result.rowCount);
}

export async function assertPartnerScope(actor: OperationalActor, organisationId: string): Promise<boolean> {
  if (actor.administrator || actor.roles.includes("data_reviewer")) return true;
  const result = await getPool().query("SELECT 1 FROM partner_memberships WHERE user_id=$1 AND organisation_id=$2 AND status='active'", [actor.userId, organisationId]);
  return Boolean(result.rowCount);
}

export async function assertParticipantScope(actor: OperationalActor, participantId: string): Promise<boolean> {
  if (actor.administrator) return true;
  const result = await getPool().query("SELECT 1 FROM pilot_participants p JOIN operational_role_assignments r ON r.pilot_id=p.pilot_id WHERE p.id=$1 AND r.user_id=$2 AND r.status='active' AND (r.expires_at IS NULL OR r.expires_at>now())", [participantId, actor.userId]);
  return Boolean(result.rowCount);
}

export async function assertSupportTicketScope(actor: OperationalActor, ticketId: string): Promise<boolean> {
  if (actor.administrator) return true;
  const result = await getPool().query("SELECT 1 FROM support_tickets t JOIN operational_role_assignments r ON r.user_id=$2 AND r.status='active' AND (r.expires_at IS NULL OR r.expires_at>now()) WHERE t.id=$1 AND (r.pilot_id IS NULL OR r.pilot_id=t.pilot_id)", [ticketId, actor.userId]);
  return Boolean(result.rowCount);
}
