import {
  boolean,
  char,
  date,
  integer,
  jsonb,
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
