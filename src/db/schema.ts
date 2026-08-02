import {
  boolean,
  char,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const importStatus = pgEnum("dataset_import_status", ["quarantined", "validated", "review_required", "approved", "published", "rejected"]);
export const recordStatus = pgEnum("record_status", ["draft", "quarantined", "verified", "archived"]);
export const contactType = pgEnum("contact_channel_type", ["telephone", "email", "webchat", "sms", "whatsapp", "drop_in", "online_form", "referral_portal", "website"]);
export const contactStatus = pgEnum("contact_channel_status", ["active", "limited", "transitioning", "existing_users_only", "temporarily_unavailable", "retired", "unverified"]);
export const displayRule = pgEnum("public_display_rule", ["show", "show_with_warning", "hide", "staff_only"]);
export const sensitivityClass = pgEnum("sensitivity_class", ["public", "personal", "sensitive", "special_category", "criminal_offence", "safeguarding"]);
export const sessionMode = pgEnum("session_mode", ["guest", "private_device", "public_device"]);

export const datasetImports = pgTable("dataset_imports", {
  id: uuid("id").primaryKey(),
  fileSha256: char("file_sha256", { length: 64 }).notNull(),
  parserVersion: text("parser_version").notNull(),
  importKind: text("import_kind").notNull(),
  sourceFilename: text("source_filename").notNull(),
  status: importStatus("status").notNull().default("quarantined"),
  uploadedBy: uuid("uploaded_by"),
  importedAt: timestamp("imported_at", { withTimezone: true }).notNull().defaultNow(),
  rawMetadata: jsonb("raw_metadata").notNull().default({}),
}, (table) => [unique().on(table.fileSha256, table.parserVersion, table.importKind)]);

export const datasetRevisions = pgTable("dataset_revisions", {
  id: uuid("id").primaryKey(),
  externalVersion: text("external_version").notNull().unique(),
  parentRevisionId: uuid("parent_revision_id"),
  reason: text("reason").notNull(),
  effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(false),
  createdFromImportId: uuid("created_from_import_id").notNull().references(() => datasetImports.id),
});

export const sources = pgTable("sources", {
  id: uuid("id").primaryKey(),
  externalId: text("external_id").notNull(),
  datasetRevisionId: uuid("dataset_revision_id").notNull().references(() => datasetRevisions.id),
  name: text("name").notNull(),
  url: text("url").notNull(),
  publisherType: text("publisher_type").notNull(),
  verifiedOn: date("verified_on").notNull(),
  reviewAfterDays: integer("review_after_days").notNull(),
  notes: text("notes").notNull().default(""),
  status: recordStatus("status").notNull().default("quarantined"),
}, (table) => [unique().on(table.datasetRevisionId, table.externalId)]);

export const services = pgTable("services", {
  id: uuid("id").primaryKey(),
  externalId: text("external_id").notNull(),
  datasetRevisionId: uuid("dataset_revision_id").notNull().references(() => datasetRevisions.id),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  serviceType: text("service_type").notNull(),
  coverage: text("coverage").notNull(),
  ages: text("ages").notNull(),
  accessModes: text("access_modes").array().notNull().default([]),
  hours: text("hours").notNull(),
  referral: text("referral").notNull(),
  lgbtqFocus: text("lgbtq_focus").notNull(),
  urgency: text("urgency").notNull(),
  notes: text("notes").notNull(),
  verifiedOn: date("verified_on").notNull(),
  status: recordStatus("status").notNull().default("quarantined"),
}, (table) => [unique().on(table.datasetRevisionId, table.externalId)]);

export const serviceTags = pgTable("service_tags", {
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  tag: text("tag").notNull(),
  sourceOrder: integer("source_order").notNull(),
}, (table) => [primaryKey({ columns: [table.serviceId, table.tag] })]);

export const contactChannels = pgTable("contact_channels", {
  id: uuid("id").primaryKey(),
  serviceId: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  channelType: contactType("channel_type").notNull(),
  value: text("value").notNull(),
  status: contactStatus("status").notNull(),
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
  lastVerified: date("last_verified").notNull(),
  intendedAudience: text("intended_audience").notNull().default("all"),
  newUsersAccepted: boolean("new_users_accepted").notNull(),
  existingUsersAccepted: boolean("existing_users_accepted").notNull(),
  publicDisplayRule: displayRule("public_display_rule").notNull(),
  replacementRoute: text("replacement_route"),
  transitionNote: text("transition_note"),
  sourceOrder: integer("source_order").notNull(),
}, (table) => [unique().on(table.serviceId, table.channelType, table.value)]);

export const councils = pgTable("councils", {
  id: uuid("id").primaryKey(),
  externalId: text("external_id").notNull(),
  datasetRevisionId: uuid("dataset_revision_id").notNull().references(() => datasetRevisions.id),
  sourceId: uuid("source_id").notNull().references(() => sources.id),
  name: text("name").notNull(),
  area: text("area").notNull(),
  homelessnessUrl: text("homelessness_url").notNull(),
  phone: text("phone").notNull(),
  hoursNotes: text("hours_notes").notNull(),
  routeNotes: text("route_notes").notNull(),
  verifiedOn: date("verified_on").notNull(),
  status: recordStatus("status").notNull().default("quarantined"),
}, (table) => [unique().on(table.datasetRevisionId, table.externalId)]);

export const triageRoutes = pgTable("triage_routes", {
  id: uuid("id").primaryKey(),
  externalId: text("external_id").notNull(),
  datasetRevisionId: uuid("dataset_revision_id").notNull().references(() => datasetRevisions.id),
  triggerName: text("trigger_name").notNull(),
  recommendedAction: text("recommended_action").notNull(),
  urgency: text("urgency").notNull(),
  safetyNote: text("safety_note").notNull(),
  verifiedOn: date("verified_on").notNull(),
  status: recordStatus("status").notNull().default("quarantined"),
}, (table) => [unique().on(table.datasetRevisionId, table.externalId)]);

export const routeConditions = pgTable("route_conditions", {
  routeId: uuid("route_id").notNull().references(() => triageRoutes.id, { onDelete: "cascade" }),
  conditionTag: text("condition_tag").notNull(),
  sourceOrder: integer("source_order").notNull(),
}, (table) => [primaryKey({ columns: [table.routeId, table.conditionTag] })]);

export const routeTargets = pgTable("route_targets", {
  routeId: uuid("route_id").notNull().references(() => triageRoutes.id, { onDelete: "cascade" }),
  targetExternalId: text("target_external_id").notNull(),
  targetKind: text("target_kind").notNull(),
  sourceOrder: integer("source_order").notNull(),
}, (table) => [primaryKey({ columns: [table.routeId, table.sourceOrder] })]);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id"),
  sessionMode: sessionMode("session_mode").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const fieldDefinitions = pgTable("field_definitions", {
  id: uuid("id").primaryKey(),
  semanticKey: text("semantic_key").notNull().unique(),
  dataType: text("data_type").notNull(),
  sensitivity: sensitivityClass("sensitivity").notNull(),
  allowedPurposes: text("allowed_purposes").array().notNull(),
  freshnessDays: integer("freshness_days"),
  explicitReviewRequired: boolean("explicit_review_required").notNull().default(false),
  saveAllowed: boolean("save_allowed").notNull().default(true),
});

export const profileFacts = pgTable("profile_facts", {
  id: uuid("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  fieldDefinitionId: uuid("field_definition_id").notNull().references(() => fieldDefinitions.id),
  valueEncrypted: text("value_encrypted").notNull(),
  provenance: jsonb("provenance").notNull(),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  supersededAt: timestamp("superseded_at", { withTimezone: true }),
});

export const consentReceipts = pgTable("consent_receipts", {
  id: uuid("id").primaryKey(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id),
  actorId: uuid("actor_id"),
  recipient: text("recipient").notNull(),
  purpose: text("purpose").notNull(),
  fieldDefinitionIds: uuid("field_definition_ids").array().notNull(),
  channel: text("channel").notNull(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  noticeVersion: text("notice_version").notNull(),
});

export const formContracts = pgTable("form_contracts", {
  id: uuid("id").primaryKey(),
  externalId: text("external_id").notNull(),
  version: text("version").notNull(),
  title: text("title").notNull(),
  purpose: text("purpose").notNull(),
  reviewRequired: boolean("review_required").notNull().default(true),
}, (table) => [unique().on(table.externalId, table.version)]);

export const autofillMappings = pgTable("autofill_mappings", {
  formContractId: uuid("form_contract_id").notNull().references(() => formContracts.id, { onDelete: "cascade" }),
  formFieldKey: text("form_field_key").notNull(),
  fieldDefinitionId: uuid("field_definition_id").notNull().references(() => fieldDefinitions.id),
  required: boolean("required").notNull(),
  allowOneTimeValue: boolean("allow_one_time_value").notNull().default(true),
  sourceOrder: integer("source_order").notNull(),
}, (table) => [primaryKey({ columns: [table.formContractId, table.formFieldKey] })]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id"),
  profileId: uuid("profile_id").references(() => profiles.id),
  mode: sessionMode("mode").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  rotatedFrom: uuid("rotated_from"),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey(),
  actorId: uuid("actor_id"),
  eventType: text("event_type").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: uuid("resource_id"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  metadata: jsonb("metadata").notNull().default({}),
});

// Phase 5 operational models mirror migration 0005. Runtime services use explicit SQL so
// safety-critical transitions remain visible and transaction boundaries remain deliberate.
export const operationalReleaseGates = pgTable("operational_release_gates", { id:text("id").primaryKey(),description:text("description").notNull(),status:text("status").notNull().default("open"),ownerUserId:uuid("owner_user_id"),acceptanceCriteria:text("acceptance_criteria").notNull(),evidence:jsonb("evidence").notNull().default([]),approvedBy:uuid("approved_by"),approvedAt:timestamp("approved_at",{withTimezone:true}),environmentImpact:text("environment_impact").notNull(),pilotImpact:text("pilot_impact").notNull(),productionImpact:text("production_impact").notNull(),humanApprovalRequired:boolean("human_approval_required").notNull().default(true),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow() });
export const pilotPrograms = pgTable("pilot_programs", { id:uuid("id").primaryKey(),name:text("name").notNull(),description:text("description").notNull(),region:text("region").notNull(),status:text("status").notNull().default("draft"),startDate:date("start_date"),endDate:date("end_date"),maximumUsers:integer("maximum_users").notNull(),maximumProfessionals:integer("maximum_professionals").notNull(),featuresEnabled:text("features_enabled").array().notNull().default([]),supportHours:text("support_hours").notNull(),safeguardingOwnerId:uuid("safeguarding_owner_id"),technicalOwnerId:uuid("technical_owner_id"),editorialOwnerId:uuid("editorial_owner_id"),dataVerificationOwnerId:uuid("data_verification_owner_id"),supportOwnerId:uuid("support_owner_id"),incidentOwnerId:uuid("incident_owner_id"),entryCriteria:jsonb("entry_criteria").notNull().default([]),exitCriteria:jsonb("exit_criteria").notNull().default([]),pauseCriteria:jsonb("pause_criteria").notNull().default([]),stopCriteria:jsonb("stop_criteria").notNull().default([]),createdBy:uuid("created_by").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),approvedAt:timestamp("approved_at",{withTimezone:true}),approvedBy:uuid("approved_by") });
export const pilotApprovals = pgTable("pilot_approvals", { id:uuid("id").primaryKey(),pilotId:uuid("pilot_id").notNull(),approvalType:text("approval_type").notNull(),status:text("status").notNull().default("pending"),evidence:jsonb("evidence").notNull().default([]),decidedBy:uuid("decided_by"),decidedAt:timestamp("decided_at",{withTimezone:true}),expiresAt:timestamp("expires_at",{withTimezone:true}),notes:text("notes"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const pilotCohorts = pgTable("pilot_cohorts", { id:uuid("id").primaryKey(),pilotId:uuid("pilot_id").notNull(),name:text("name").notNull(),description:text("description").notNull(),participantType:text("participant_type").notNull(),maximumParticipants:integer("maximum_participants").notNull(),startDate:date("start_date"),endDate:date("end_date"),status:text("status").notNull().default("draft"),featuresAvailable:text("features_available").array().notNull().default([]),supportModel:text("support_model").notNull(),consentVersion:text("consent_version").notNull(),dataPermitted:text("data_permitted").array().notNull().default([]),exitCriteria:jsonb("exit_criteria").notNull().default([]),approvedBy:uuid("approved_by"),approvedAt:timestamp("approved_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const pilotParticipants = pgTable("pilot_participants", { id:uuid("id").primaryKey(),pilotId:uuid("pilot_id").notNull(),cohortId:uuid("cohort_id").notNull(),userId:uuid("user_id"),invitationHash:char("invitation_hash",{length:64}).notNull().unique(),eligibilityStatus:text("eligibility_status").notNull().default("pending"),status:text("status").notNull().default("invited"),safeContactEncrypted:text("safe_contact_encrypted"),supportNeedsEncrypted:text("support_needs_encrypted"),accessibilityPreferencesEncrypted:text("accessibility_preferences_encrypted"),joinedAt:timestamp("joined_at",{withTimezone:true}),withdrawnAt:timestamp("withdrawn_at",{withTimezone:true}),exportRequestedAt:timestamp("export_requested_at",{withTimezone:true}),deletionRequestedAt:timestamp("deletion_requested_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const pilotParticipantConsents = pgTable("pilot_participant_consents", { id:uuid("id").primaryKey(),participantId:uuid("participant_id").notNull(),consentType:text("consent_type").notNull(),noticeVersion:text("notice_version").notNull(),grantedAt:timestamp("granted_at",{withTimezone:true}),revokedAt:timestamp("revoked_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const pilotFeatureFlags = pgTable("pilot_feature_flags", { id:text("id").primaryKey(),description:text("description").notNull(),environment:text("environment").notNull(),region:text("region"),pilotId:uuid("pilot_id"),cohortId:uuid("cohort_id"),defaultState:boolean("default_state").notNull().default(false),currentState:boolean("current_state").notNull().default(false),ownerUserId:uuid("owner_user_id"),riskLevel:text("risk_level").notNull(),approvalRequirement:text("approval_requirement").notNull(),dependencies:text("dependencies").array().notNull().default([]),lastChangedAt:timestamp("last_changed_at",{withTimezone:true}).notNull().defaultNow(),changedBy:uuid("changed_by"),changeReason:text("change_reason").notNull(),reviewAt:timestamp("review_at",{withTimezone:true}) });
export const pilotFeatureFlagHistory = pgTable("pilot_feature_flag_history", { id:uuid("id").primaryKey(),flagId:text("flag_id").notNull(),previousState:boolean("previous_state").notNull(),newState:boolean("new_state").notNull(),changedBy:uuid("changed_by").notNull(),reason:text("reason").notNull(),approvals:jsonb("approvals").notNull().default([]),changedAt:timestamp("changed_at",{withTimezone:true}).notNull().defaultNow() });
export const supportTickets = pgTable("support_tickets", { id:uuid("id").primaryKey(),reporterUserId:uuid("reporter_user_id"),anonymousReporter:boolean("anonymous_reporter").notNull().default(false),category:text("category").notNull(),severity:text("severity").notNull(),descriptionEncrypted:text("description_encrypted").notNull(),safeContactEncrypted:text("safe_contact_encrypted"),relatedCaseId:uuid("related_case_id"),relatedServiceExternalId:text("related_service_external_id"),relatedCouncilExternalId:text("related_council_external_id"),pilotId:uuid("pilot_id"),assignedOwnerId:uuid("assigned_owner_id"),status:text("status").notNull().default("open"),responseDeadline:timestamp("response_deadline",{withTimezone:true}).notNull(),resolutionEncrypted:text("resolution_encrypted"),closedAt:timestamp("closed_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow() });
export const operationalIncidents = pgTable("operational_incidents", { id:uuid("id").primaryKey(),severity:text("severity").notNull(),category:text("category").notNull(),summary:text("summary").notNull(),detectedBy:uuid("detected_by"),detectedAt:timestamp("detected_at",{withTimezone:true}).notNull().defaultNow(),affectedSystem:text("affected_system").notNull(),affectedRecords:integer("affected_records").notNull().default(0),safeguardingImpact:text("safeguarding_impact").notNull(),privacyImpact:text("privacy_impact").notNull(),securityImpact:text("security_impact").notNull(),incidentCommanderId:uuid("incident_commander_id"),containmentAction:text("containment_action"),communicationStatus:text("communication_status").notNull(),regulatorAssessment:text("regulator_assessment"),rootCause:text("root_cause"),remediation:text("remediation"),status:text("status").notNull().default("open"),closedAt:timestamp("closed_at",{withTimezone:true}),postIncidentReview:jsonb("post_incident_review"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow() });
export const incidentActions = pgTable("incident_actions", { id:uuid("id").primaryKey(),incidentId:uuid("incident_id").notNull(),actionType:text("action_type").notNull(),targetType:text("target_type").notNull(),targetId:text("target_id"),previousState:jsonb("previous_state").notNull().default({}),newState:jsonb("new_state").notNull().default({}),reason:text("reason").notNull(),performedBy:uuid("performed_by").notNull(),performedAt:timestamp("performed_at",{withTimezone:true}).notNull().defaultNow() });
export const pilotFeedback = pgTable("pilot_feedback", { id:uuid("id").primaryKey(),reporterUserId:uuid("reporter_user_id"),anonymous:boolean("anonymous").notNull().default(true),category:text("category").notNull(),rating:integer("rating"),textEncrypted:text("text_encrypted"),relatedPage:text("related_page"),relatedServiceExternalId:text("related_service_external_id"),relatedCouncilExternalId:text("related_council_external_id"),cohortId:uuid("cohort_id"),assignedOwnerId:uuid("assigned_owner_id"),status:text("status").notNull().default("open"),resolutionEncrypted:text("resolution_encrypted"),productChangeReference:text("product_change_reference"),trackingTokenHash:char("tracking_token_hash",{length:64}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const pilotOutcomes = pgTable("pilot_outcomes", { id:uuid("id").primaryKey(),pilotId:uuid("pilot_id").notNull(),cohortId:uuid("cohort_id"),participantId:uuid("participant_id"),outcomeType:text("outcome_type").notNull(),occurredOn:date("occurred_on").notNull(),region:text("region").notNull(),source:text("source").notNull(),confidence:text("confidence").notNull(),optional:boolean("optional").notNull().default(true),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const partnerOrganisations = pgTable("partner_organisations", { id:uuid("id").primaryKey(),name:text("name").notNull(),partnerType:text("partner_type").notNull(),region:text("region").notNull(),status:text("status").notNull().default("pending"),primaryContactEncrypted:text("primary_contact_encrypted"),safeguardingContactEncrypted:text("safeguarding_contact_encrypted"),dataProtectionContactEncrypted:text("data_protection_contact_encrypted"),agreementStatus:text("agreement_status").notNull(),trainingStatus:text("training_status").notNull(),verificationStatus:text("verification_status").notNull(),suspendedAt:timestamp("suspended_at",{withTimezone:true}),revokedAt:timestamp("revoked_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const partnerMemberships = pgTable("partner_memberships", { id:uuid("id").primaryKey(),organisationId:uuid("organisation_id").notNull(),userId:uuid("user_id").notNull(),role:text("role").notNull(),status:text("status").notNull().default("pending"),approvedBy:uuid("approved_by"),approvedAt:timestamp("approved_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const partnerAgreements = pgTable("partner_agreements", { id:uuid("id").primaryKey(),organisationId:uuid("organisation_id").notNull(),agreementType:text("agreement_type").notNull(),version:text("version").notNull(),status:text("status").notNull().default("draft"),approvedBy:uuid("approved_by"),approvedAt:timestamp("approved_at",{withTimezone:true}),expiresAt:timestamp("expires_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const serviceCorrectionProposals = pgTable("service_correction_proposals", { id:uuid("id").primaryKey(),recordType:text("record_type").notNull(),recordExternalId:text("record_external_id").notNull(),currentValue:jsonb("current_value").notNull(),proposedValue:jsonb("proposed_value").notNull(),reason:text("reason").notNull(),evidence:jsonb("evidence").notNull().default([]),urgency:text("urgency").notNull(),submittedBy:uuid("submitted_by"),partnerOrganisationId:uuid("partner_organisation_id"),verificationStatus:text("verification_status").notNull().default("pending"),reviewerId:uuid("reviewer_id"),decision:text("decision"),datasetRevisionId:uuid("dataset_revision_id"),publishedAt:timestamp("published_at",{withTimezone:true}),temporarilyHiddenAt:timestamp("temporarily_hidden_at",{withTimezone:true}),hiddenBy:uuid("hidden_by"),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const launchChecklists = pgTable("launch_checklists", { id:uuid("id").primaryKey(),name:text("name").notNull(),environment:text("environment").notNull(),releaseVersion:text("release_version"),status:text("status").notNull().default("draft"),createdBy:uuid("created_by").notNull(),approvedBy:uuid("approved_by"),approvedAt:timestamp("approved_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const launchChecklistItems = pgTable("launch_checklist_items", { id:uuid("id").primaryKey(),checklistId:uuid("checklist_id").notNull(),category:text("category").notNull(),title:text("title").notNull(),ownerUserId:uuid("owner_user_id"),status:text("status").notNull().default("open"),evidence:jsonb("evidence").notNull().default([]),risk:text("risk").notNull(),approverId:uuid("approver_id"),blockingEffect:text("blocking_effect").notNull(),completedAt:timestamp("completed_at",{withTimezone:true}) });
export const operatingCostModels = pgTable("operating_cost_models", { id:uuid("id").primaryKey(),name:text("name").notNull(),scenario:text("scenario").notNull(),currency:char("currency",{length:3}).notNull(),createdBy:uuid("created_by").notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow() });
export const operatingCostItems = pgTable("operating_cost_items", { id:uuid("id").primaryKey(),modelId:uuid("model_id").notNull(),category:text("category").notNull(),item:text("item").notNull(),quantity:numeric("quantity",{precision:12,scale:2}).notNull(),unitCost:numeric("unit_cost",{precision:14,scale:2}).notNull(),frequency:text("frequency").notNull(),source:text("source").notNull(),sourceDate:date("source_date").notNull(),confidence:text("confidence").notNull(),notes:text("notes").notNull().default("") });
export const operationalAnalyticsEvents = pgTable("operational_analytics_events", { id:uuid("id").primaryKey(),pilotId:uuid("pilot_id"),eventType:text("event_type").notNull(),region:text("region").notNull(),occurredOn:date("occurred_on").notNull(),eventCount:integer("event_count").notNull().default(1),dimensions:jsonb("dimensions").notNull().default({}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const commissionerReports = pgTable("commissioner_reports", { id:uuid("id").primaryKey(),pilotId:uuid("pilot_id").notNull(),periodStart:date("period_start").notNull(),periodEnd:date("period_end").notNull(),minimumGroupSize:integer("minimum_group_size").notNull().default(5),status:text("status").notNull().default("draft"),generatedBy:uuid("generated_by").notNull(),reportData:jsonb("report_data").notNull(),limitations:jsonb("limitations").notNull().default([]),generatedAt:timestamp("generated_at",{withTimezone:true}).notNull().defaultNow() });
export const operationalReleases = pgTable("operational_releases", { id:uuid("id").primaryKey(),releaseVersion:text("release_version").notNull().unique(),commitSha:char("commit_sha",{length:40}).notNull(),datasetRevision:text("dataset_revision").notNull(),migrationLevel:text("migration_level").notNull(),environment:text("environment").notNull(),status:text("status").notNull().default("draft"),checklistId:uuid("checklist_id"),approverId:uuid("approver_id"),releaseOwnerId:uuid("release_owner_id"),rollbackOwnerId:uuid("rollback_owner_id"),releaseNotes:text("release_notes").notNull(),backupReference:text("backup_reference"),rollbackVersion:text("rollback_version"),releasedAt:timestamp("released_at",{withTimezone:true}),rollbackPreparedAt:timestamp("rollback_prepared_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
export const releaseApprovals = pgTable("release_approvals", { id:uuid("id").primaryKey(),releaseId:uuid("release_id").notNull(),approvalType:text("approval_type").notNull(),status:text("status").notNull().default("pending"),approvedBy:uuid("approved_by"),approvedAt:timestamp("approved_at",{withTimezone:true}),evidence:jsonb("evidence").notNull().default([]) });
export const pilotNotificationPreferences = pgTable("pilot_notification_preferences", { id:uuid("id").primaryKey(),participantId:uuid("participant_id").notNull(),channel:text("channel").notNull(),category:text("category").notNull(),wording:text("wording").notNull().default("ultra_neutral"),enabled:boolean("enabled").notNull().default(false),quietHours:jsonb("quiet_hours").notNull().default({}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow() });
export const operationalRoleAssignments = pgTable("operational_role_assignments", { id:uuid("id").primaryKey(),userId:uuid("user_id").notNull(),role:text("role").notNull(),region:text("region"),pilotId:uuid("pilot_id"),status:text("status").notNull().default("pending"),approvedBy:uuid("approved_by"),approvedAt:timestamp("approved_at",{withTimezone:true}),expiresAt:timestamp("expires_at",{withTimezone:true}),createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow() });
