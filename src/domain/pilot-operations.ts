import { z } from "zod";

const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum);
const optionalUuid = z.uuid().nullable().optional();

export const pilotStatuses = ["draft", "awaiting_approval", "approved", "scheduled", "active", "paused", "stopped", "completed", "archived"] as const;
export const pilotParticipantTypes = ["internal_synthetic", "lived_experience", "professional_partner", "supported_real_user", "expanded_controlled"] as const;
export const featureFlagIds = ["pilot.registration", "pilot.accounts", "pilot.profiles", "pilot.cases", "pilot.evidence", "pilot.advocates", "pilot.professionals", "pilot.external_email", "pilot.direct_council_submission", "pilot.ai_case_summaries", "pilot.notifications", "pilot.feedback", "pilot.analytics", "pilot.partner_portal", "pilot.provider_correction_portal", "production.public_access"] as const;
export const supportCategories = ["technical", "accessibility", "housing_content", "incorrect_service_information", "privacy", "security", "safeguarding", "complaint", "feature_request", "account_access", "evidence_problem", "consent_sharing"] as const;
export const incidentSeverities = ["p0", "p1", "p2", "p3"] as const;
export const outcomeTypes = ["correct_council_identified", "application_prepared", "application_submitted", "reference_number_obtained", "specialist_service_contacted", "emergency_accommodation_obtained", "eviction_prevented", "housing_plan_received", "reasonable_adjustments_requested", "gatekeeping_challenged", "review_requested", "advocate_involved", "understood_next_step", "improved_confidence"] as const;

const pilotFieldsSchema = z.object({
  name: boundedText(160), description: boundedText(4_000), region: boundedText(120),
  startDate: z.iso.date().nullable().optional(), endDate: z.iso.date().nullable().optional(),
  maximumUsers: z.number().int().min(1).max(10_000), maximumProfessionals: z.number().int().min(0).max(5_000),
  supportHours: boundedText(500), safeguardingOwnerId: optionalUuid, technicalOwnerId: optionalUuid,
  editorialOwnerId: optionalUuid, dataVerificationOwnerId: optionalUuid, supportOwnerId: optionalUuid, incidentOwnerId: optionalUuid,
  entryCriteria: z.array(boundedText(500)).max(50).default([]), exitCriteria: z.array(boundedText(500)).max(50).default([]),
  pauseCriteria: z.array(boundedText(500)).max(50).default([]), stopCriteria: z.array(boundedText(500)).max(50).default([]),
}).strict();

const validatePilotDates = (value: { startDate?: string | null; endDate?: string | null }, context: z.RefinementCtx) => { if (value.startDate && value.endDate && value.endDate < value.startDate) context.addIssue({ code: "custom", path: ["endDate"], message: "End date must not be before the start date." }); };
export const createPilotSchema = pilotFieldsSchema.superRefine(validatePilotDates);

export const updatePilotSchema = pilotFieldsSchema.partial().extend({ status: z.enum(pilotStatuses).optional() }).strict().superRefine(validatePilotDates);

export const cohortSchema = z.object({
  name: boundedText(160), description: boundedText(4_000), participantType: z.enum(pilotParticipantTypes),
  maximumParticipants: z.number().int().min(1).max(10_000), startDate: z.iso.date().nullable().optional(), endDate: z.iso.date().nullable().optional(),
  supportModel: boundedText(1_000), consentVersion: boundedText(80), dataPermitted: z.array(boundedText(120)).max(30).default([]),
  exitCriteria: z.array(boundedText(500)).max(50).default([]), featuresAvailable: z.array(z.enum(featureFlagIds)).max(featureFlagIds.length).default([]),
}).strict();

export const participantSchema = z.object({
  cohortId: z.uuid(), email: z.email().optional(), eligibilityStatus: z.enum(["pending", "eligible", "ineligible"]).default("pending"),
  safeContact: boundedText(500).optional(), supportNeeds: boundedText(2_000).optional(), accessibilityPreferences: boundedText(2_000).optional(),
}).strict();

export const participantConsentSchema = z.object({
  consentType: z.enum(["service_use", "pilot_participation", "optional_feedback", "optional_research", "optional_post_pilot_contact"]),
  noticeVersion: boundedText(80), granted: z.boolean(),
}).strict();

export const featureFlagChangeSchema = z.object({ enabled: z.boolean(), reason: boundedText(1_000), approvals: z.array(z.string().max(500)).max(20).default([]) }).strict();

export const supportTicketSchema = z.object({
  category: z.enum(supportCategories), severity: z.enum(["critical", "high", "material", "standard"]).default("standard"),
  description: boundedText(8_000), safeContact: boundedText(500).optional(), relatedCaseId: z.uuid().optional(),
  relatedServiceExternalId: boundedText(160).optional(), relatedCouncilExternalId: boundedText(160).optional(), pilotId: z.uuid().optional(), anonymous: z.boolean().default(false),
}).strict();
export const supportTicketUpdateSchema = z.object({ assignedOwnerId:z.uuid().nullable().optional(),status:z.enum(["open","triaged","assigned","waiting_for_reporter","in_progress","resolved","closed"]).optional(),resolution:z.string().trim().min(1).max(8000).optional() }).strict().refine(value=>Object.keys(value).length>0,{message:"Provide at least one support-ticket update."});

export const incidentSchema = z.object({
  severity: z.enum(incidentSeverities), category: boundedText(120), summary: boundedText(2_000), affectedSystem: boundedText(200),
  affectedRecords: z.number().int().min(0).max(1_000_000).default(0), safeguardingImpact: boundedText(1_000).default("none_recorded"),
  privacyImpact: boundedText(1_000).default("none_recorded"), securityImpact: boundedText(1_000).default("none_recorded"), incidentCommanderId: optionalUuid,
}).strict();
export const incidentUpdateSchema = z.object({ incidentCommanderId:z.uuid().nullable().optional(),status:z.enum(["open","contained","monitoring","resolved","closed"]).optional(),containmentAction:z.string().trim().max(4000).optional(),communicationStatus:z.string().trim().max(500).optional(),regulatorAssessment:z.string().trim().max(4000).optional(),rootCause:z.string().trim().max(8000).optional(),remediation:z.string().trim().max(8000).optional(),postIncidentReview:z.record(z.string(),z.unknown()).optional() }).strict().refine(value=>Object.keys(value).length>0,{message:"Provide at least one incident update."});

export const incidentActionSchema = z.object({
  actionType: z.enum(["disable_feature", "pause_registration", "disable_evidence", "disable_email", "disable_advocate_invites", "hide_service", "pause_pilot", "service_notice", "rollback_prepared"]),
  targetType: z.enum(["feature_flag", "pilot", "service", "registration", "release"]), targetId: boundedText(200).optional(), reason: boundedText(2_000),
}).strict();

export const feedbackSchema = z.object({
  category: z.enum(["usefulness", "accessibility", "incorrect_information", "complaint", "privacy", "safeguarding", "feature_suggestion", "positive_outcome", "confusing"]),
  rating: z.number().int().min(1).max(5).optional(), text: z.string().trim().max(8_000).optional(), anonymous: z.boolean().default(true),
  relatedPage: z.string().trim().max(300).optional(), relatedServiceExternalId: z.string().trim().max(160).optional(), relatedCouncilExternalId: z.string().trim().max(160).optional(), cohortId: z.uuid().optional(),
}).strict().refine((value) => value.rating !== undefined || Boolean(value.text), { message: "Provide a rating or feedback text." });

export const outcomeSchema = z.object({
  pilotId: z.uuid(), cohortId: z.uuid().optional(), participantId: z.uuid().optional(), outcomeType: z.enum(outcomeTypes),
  occurredOn: z.iso.date(), region: boundedText(120), source: z.enum(["user_reported", "staff_recorded", "system_event", "confirmed"]),
}).strict();

export const partnerSchema = z.object({
  name: boundedText(200), partnerType: boundedText(120), region: boundedText(120), primaryContact: boundedText(500).optional(),
  safeguardingContact: boundedText(500).optional(), dataProtectionContact: boundedText(500).optional(),
}).strict();

export const correctionProposalSchema = z.object({
  recordType: z.enum(["service", "council"]), recordExternalId: boundedText(160), currentValue: z.record(z.string(), z.unknown()),
  proposedValue: z.record(z.string(), z.unknown()), reason: boundedText(4_000), evidence: z.array(z.object({ source: boundedText(500), checkedAt: z.iso.datetime().optional() })).max(20).default([]),
  urgency: z.enum(["standard", "high", "critical"]).default("standard"), partnerOrganisationId: z.uuid().optional(),
}).strict();

export const costModelSchema = z.object({ name: boundedText(160), scenario: z.enum(["development", "small_controlled_pilot", "kent_public_beta", "full_kent_medway", "regional_expansion"]), currency: z.string().regex(/^[A-Z]{3}$/) }).strict();
export const costItemSchema = z.object({ category: boundedText(120), item: boundedText(200), quantity: z.number().min(0), unitCost: z.number().min(0), frequency: z.enum(["one_off", "monthly", "quarterly", "annual"]), source: boundedText(500), sourceDate: z.iso.date(), confidence: z.enum(["low", "medium", "high", "confirmed"]), notes: z.string().trim().max(2_000).default("") }).strict();

export const launchChecklistSchema = z.object({ name: boundedText(160), environment: z.enum(["staging", "pilot", "production"]), releaseVersion: z.string().trim().max(120).optional() }).strict();
export const releaseSchema = z.object({ releaseVersion: boundedText(120), commitSha: z.string().regex(/^[a-f0-9]{40}$/), datasetRevision: boundedText(80), migrationLevel: boundedText(120), environment: z.enum(["staging", "pilot", "production"]), checklistId: z.uuid().optional(), releaseOwnerId: optionalUuid, rollbackOwnerId: optionalUuid, releaseNotes: boundedText(8_000), rollbackVersion: z.string().trim().max(120).optional() }).strict();
export const notificationPreferenceSchema = z.object({ channel:z.enum(["in_app","email","sms","push"]),category:boundedText(120),wording:z.enum(["normal","discreet","ultra_neutral"]).default("ultra_neutral"),enabled:z.boolean().default(false),quietHours:z.object({start:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),end:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)}).optional() }).strict();

export type GateState = { id: string; status: string; humanApprovalRequired: boolean; approvedAt?: Date | null };
export type PilotActivationInput = { status: string; maximumUsers: number; owners: Record<string, string | null | undefined>; cohortApproved: boolean; supportConfigured: boolean; rollbackVerified: boolean; backupVerified: boolean };

export function pilotActivationBlockers(pilot: PilotActivationInput, gates: GateState[], flagDefaults: { id: string; defaultState: boolean }[]): string[] {
  const blockers: string[] = [];
  if (pilot.status !== "approved" && pilot.status !== "scheduled") blockers.push("Pilot status is not approved or scheduled.");
  if (pilot.maximumUsers < 1) blockers.push("Maximum participant count is missing.");
  for (const [name, owner] of Object.entries(pilot.owners)) if (!owner) blockers.push(`${name} owner is not assigned.`);
  if (!pilot.cohortApproved) blockers.push("No approved cohort exists.");
  if (!pilot.supportConfigured) blockers.push("Support channel is not configured.");
  if (!pilot.rollbackVerified) blockers.push("Rollback plan is not verified.");
  if (!pilot.backupVerified) blockers.push("Backup is not verified.");
  for (const gate of gates) if (gate.status !== "closed") blockers.push(`${gate.id} is ${gate.status}.`);
  for (const flag of flagDefaults) if (flag.defaultState) blockers.push(`${flag.id} does not default to disabled.`);
  return [...new Set(blockers)];
}

export function suppressSmallCells<T extends { count: number }>(rows: T[], minimumGroupSize = 5): Array<T & { suppressed: boolean; count: number | null }> {
  if (!Number.isInteger(minimumGroupSize) || minimumGroupSize < 5) throw new Error("Minimum group size must be at least five.");
  return rows.map((row) => ({ ...row, suppressed: row.count < minimumGroupSize, count: row.count < minimumGroupSize ? null : row.count }));
}

export function annualisedCost(quantity: number, unitCost: number, frequency: "one_off" | "monthly" | "quarterly" | "annual"): number {
  const multiplier = { one_off: 1, monthly: 12, quarterly: 4, annual: 1 }[frequency];
  return Math.round(quantity * unitCost * multiplier * 100) / 100;
}
