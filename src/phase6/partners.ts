import { z } from "zod";

export const partnerStatuses = ["invited", "pending_verification", "verified", "limited", "suspended", "expired", "revoked", "archived"] as const;
export type PartnerStatus = typeof partnerStatuses[number];
export type PartnerPermission = "manage_own_services" | "submit_proposals" | "view_own_proposals";

export function partnerPermissions(status: PartnerStatus, agreementActive: boolean): ReadonlySet<PartnerPermission> {
  if (!agreementActive || !["verified", "limited"].includes(status)) return new Set();
  return new Set(status === "verified" ? ["manage_own_services", "submit_proposals", "view_own_proposals"] : ["view_own_proposals"]);
}

export function partnerCanAccessCase(): false { return false; }
export function canEditProviderOrganisation(actorOrganisationId: string, targetOrganisationId: string, role: string) { return actorOrganisationId === targetOrganisationId && ["administrator", "service_editor"].includes(role); }
export function canAdministerRegion(assignedRegionId: string | null, targetRegionId: string, globalAdministrator: boolean) { return globalAdministrator || assignedRegionId === targetRegionId; }

export const proposalInput = z.object({
  organisationId: z.string().uuid(), serviceId: z.string().min(3).max(120), field: z.enum(["organisation_name", "service_name", "contact_methods", "opening_hours", "referral_routes", "age_criteria", "geographic_coverage", "lgbtqia_specialism", "accessibility", "pets", "assistance_animals", "immigration_eligibility", "substance_use_criteria", "temporary_closure", "capacity_limitations"]),
  currentValue: z.string().max(4000), proposedValue: z.string().min(1).max(4000), reason: z.string().min(10).max(2000), evidenceReference: z.string().max(500).optional(), urgency: z.enum(["standard", "urgent", "safety_critical"]),
}).strict();

export type ProposalState = "draft" | "submitted" | "under_review" | "approved_for_revision" | "rejected" | "withdrawn" | "published";
const transitions: Record<ProposalState, ProposalState[]> = { draft: ["submitted", "withdrawn"], submitted: ["under_review", "withdrawn"], under_review: ["approved_for_revision", "rejected"], approved_for_revision: ["published", "rejected"], rejected: [], withdrawn: [], published: [] };
export function transitionProposal(current: ProposalState, next: ProposalState, actor: "provider" | "reviewer" | "publisher") {
  if (!transitions[current].includes(next)) return false;
  if (next === "published") return actor === "publisher";
  if (["under_review", "approved_for_revision", "rejected"].includes(next)) return actor === "reviewer";
  return actor === "provider";
}

export function emergencyHideService(reason: string, actorRole: string) {
  if (!reason.trim() || !["administrator", "data_steward", "safeguarding_reviewer"].includes(actorRole)) throw new Error("Emergency hiding requires an authorised reviewer and a reason.");
  return { publicVisibility: "temporarily_hidden" as const, preserveHistory: true, requiresReview: true, reason: reason.trim() };
}
