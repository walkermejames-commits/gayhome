import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { proposalInput } from "@/phase6/partners";
import { getPool } from "@/server/db/pool";
import { apiError, originIsTrusted, publicNoStoreHeaders, validationError } from "@/server/http";
import { requirePartnerUser } from "@/server/phase6-authorization";

export async function POST(request: NextRequest) {
  if (!originIsTrusted(request)) return apiError(403, "ORIGIN_REJECTED", "The request origin was not accepted.");
  if (!request.headers.get("content-type")?.startsWith("application/json")) return apiError(415, "CONTENT_TYPE", "Use application/json.");
  const body = await request.json().catch(() => null);
  const parsed = proposalInput.safeParse(body);
  if (!parsed.success) return validationError(parsed.error);
  const access = await requirePartnerUser(parsed.data.organisationId);
  if (!access || !["administrator", "service_editor"].includes(access.partnerRole)) return apiError(403, "PARTNER_ACCESS_DENIED", "An authorised service editor is required.");
  const managed = await getPool().query("SELECT 1 FROM partner_managed_services WHERE organisation_id=$1 AND service_external_id=$2 AND management_status='verified'", [access.organisationId, parsed.data.serviceId]);
  if (!managed.rowCount) return apiError(403, "SERVICE_SCOPE_DENIED", "This organisation is not verified to manage that service.");
  const id = randomUUID();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO provider_update_proposals(id,organisation_id,service_external_id,field_name,current_value,proposed_value,reason,evidence_metadata,submitted_by,submitted_at,urgency,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),$10,'submitted')", [id, parsed.data.organisationId, parsed.data.serviceId, parsed.data.field, JSON.stringify(parsed.data.currentValue), JSON.stringify(parsed.data.proposedValue), parsed.data.reason, { reference: parsed.data.evidenceReference ?? null, bytesAccepted: false }, access.userId, parsed.data.urgency]);
    await client.query("INSERT INTO audit_events(id,actor_id,event_type,resource_type,resource_id,metadata) VALUES($1,$2,'provider.proposal_submitted','provider_update_proposal',$3,$4)", [randomUUID(), access.userId, id, { organisationId: access.organisationId, field: parsed.data.field }]);
    await client.query("COMMIT");
    return NextResponse.json({ id, status: "submitted", publicationAllowed: false }, { status: 201, headers: publicNoStoreHeaders });
  } catch { await client.query("ROLLBACK").catch(() => {}); return apiError(500, "PROPOSAL_FAILED", "The proposal could not be saved."); } finally { client.release(); }
}
