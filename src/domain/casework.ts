import { z } from "zod";

export const caseStatuses = ["draft","active","waiting_for_response","action_required","emergency","under_review","escalated","temporarily_paused","resolved","closed","archived"] as const;
export const caseTypes = ["homelessness_application","eviction_prevention","domestic_abuse_relocation","temporary_accommodation_suitability","housing_register_dispute","prison_release","refugee_asylum_accommodation","social_care_housing","landlord_harassment","unlawful_eviction","other"] as const;
export const eventTypes = ["housing_event","council_contact","telephone_call","email","letter","appointment","referral","application","evidence_upload","notice_received","court_document","decision_received","accommodation_offer","accommodation_move","suitability_concern","complaint","review_request","councillor_contact","mp_contact","medical_event","police_incident","safeguarding_event","advocate_action","deadline","reminder","user_note"] as const;
export const permissions = ["view_summary","view_profile_fields","view_timeline","view_evidence","upload_evidence","add_notes","prepare_letters","complete_tasks","view_deadlines","request_consent","export_documents"] as const;

const safeText = (max: number) => z.string().trim().min(1).max(max);
export const createCaseSchema = z.object({
  title: safeText(160), caseType: z.enum(caseTypes), urgency: z.enum(["standard","soon","urgent","immediate"]).default("standard"),
  councilExternalId: z.string().trim().max(80).optional(), currentArea: z.string().trim().max(160).optional(),
  safeContact: z.boolean().default(true), discreetMode: z.boolean().default(false), accessibilityNeeds: z.string().trim().max(4000).optional(),
}).strict();
export const updateCaseSchema = z.object({
  status: z.enum(caseStatuses).optional(), urgency: z.enum(["standard","soon","urgent","immediate"]).optional(),
  title: safeText(160).optional(), currentArea: z.string().trim().max(160).optional(), currentDuty: z.string().trim().max(160).optional(),
  homelessnessStage: z.string().trim().max(160).optional(), primaryDeadline: z.iso.datetime().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);
export const eventSchema = z.object({
  eventAt: z.iso.datetime(), eventType: z.enum(eventTypes), organisation: z.string().trim().max(200).optional(),
  personContacted: z.string().trim().max(200).optional(), contactMethod: z.string().trim().max(80).optional(),
  description: safeText(8000), outcome: z.string().trim().max(8000).optional(), referenceNumber: z.string().trim().max(300).optional(),
  followUpAction: z.string().trim().max(2000).optional(), deadlineAt: z.iso.datetime().optional(),
  privacyClassification: z.enum(["public","personal","sensitive","special_category","criminal_offence","safeguarding"]).default("personal"),
}).strict();
export const deadlineSchema = z.object({
  title: safeText(200), dueAt: z.iso.datetime(), source: safeText(300), deadlineStatus: z.enum(["confirmed","estimated","suggested_follow_up","user_reminder"]),
  confidence: z.enum(["low","medium","high","confirmed"]), consequence: z.string().trim().max(2000).optional(), calculationRule: z.string().trim().max(1000).optional(),
}).strict();
export const applicationSchema = z.object({
  kind: safeText(100), destination: safeText(300), status: z.enum(["draft","ready_for_review","ready_to_send","submitted","acknowledged","more_information_requested","under_consideration","accepted","refused","closed","escalated","withdrawn"]).default("draft"),
  referenceNumber: z.string().trim().max(300).optional(), sharedFields: z.array(z.string().trim().max(120)).max(100).default([]),
}).strict();
export const dutySchema = z.object({ dutyType: safeText(120), startDate: z.iso.date().optional(), councilExternalId: z.string().trim().max(80).optional(), legalStatus: z.enum(["user_reported","appears_under_consideration","document_suggests","confirmed_in_writing","disputed"]).default("user_reported"), notes: z.string().trim().max(5000).optional() }).strict();
export const evidenceMetadataSchema = z.object({ title: safeText(240), category: safeText(120), description: z.string().trim().max(4000).optional(), sensitivity: z.enum(["personal","sensitive","special_category","criminal_offence","safeguarding"]).default("sensitive") }).strict();
export const invitationSchema = z.object({ caseId: z.uuid(), email: z.email().max(320), helperType: safeText(80), expiresAt: z.iso.datetime(), permissions: z.array(z.enum(permissions)).min(1).max(20), sensitiveCategories: z.array(z.enum(["special_category","criminal_offence","safeguarding"])).max(3).default([]) }).strict();
export const consentSchema = z.object({ caseId: z.uuid(), recipient: safeText(300), purpose: safeText(500), fieldKeys: z.array(z.string().trim().max(120)).max(100), documentIds: z.array(z.uuid()).max(100).default([]), permittedActions: z.array(z.enum(permissions)).max(20), startsAt: z.iso.datetime(), expiresAt: z.iso.datetime(), contactChannel: z.string().trim().max(80).optional(), onwardSharing: z.boolean().default(false), includeNewInformation: z.boolean().default(false) }).strict();
export const documentTypes = ["homelessness_application","emergency_accommodation_request","interim_accommodation_request","gatekeeping_challenge","written_decision_request","personalised_housing_plan_request","reasonable_adjustment_request","suitability_concern","suitability_review_request","statutory_review_request","late_review_request","complaint","escalated_complaint","ombudsman_preparation","councillor_casework_request","mp_casework_request","gp_evidence_request","hospital_evidence_request","probation_evidence_request","support_worker_evidence_request","subject_access_request","case_chronology","evidence_index","impact_statement","domestic_abuse_safety_statement","advocate_authority_letter"] as const;
export const documentSchema=z.object({documentType:z.enum(documentTypes),title:safeText(200),body:safeText(30000),templateId:safeText(120),templateVersion:z.string().regex(/^\d+\.\d+\.\d+$/),profileFields:z.array(z.string().trim().max(120)).max(100).default([]),caseFields:z.array(z.string().trim().max(120)).max(100).default([]),evidenceIds:z.array(z.uuid()).max(100).default([]),consentId:z.uuid().optional()}).strict();
export const suitabilitySchema=z.object({accommodationAddress:z.string().trim().max(500).optional(),offeredAt:z.iso.datetime().optional(),assessment:z.object({safety:z.string().trim().max(2000).optional(),accessibility:z.string().trim().max(2000).optional(),location:z.string().trim().max(2000).optional(),condition:z.string().trim().max(2000).optional(),household:z.string().trim().max(2000).optional()}).strict(),urgentRisks:z.array(z.string().trim().max(500)).max(20).default([]),userView:z.string().trim().max(8000).optional(),status:z.enum(["draft","ready_for_advice","review_requested","closed"]).default("draft")}).strict();
export const complaintSchema=z.object({route:z.enum(["informal_follow_up","manager_escalation","formal_complaint","stage_two_complaint","ombudsman_preparation"]),destination:z.string().trim().max(300).optional(),deadlineAt:z.iso.datetime().optional(),summary:safeText(10000)}).strict();
export const reviewSchema=z.object({decisionType:safeText(160),decisionReceivedAt:z.iso.datetime().optional(),inWriting:z.boolean().optional(),reasons:z.string().trim().max(10000).optional(),deadlineAt:z.iso.datetime().optional(),deadlineStatus:z.enum(["confirmed","estimated","unknown"]).default("unknown"),delayReason:z.string().trim().max(5000).optional()}).strict();
