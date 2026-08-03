const TABLES = [
  "dataset_imports", "dataset_revisions", "sources", "source_verifications", "services",
  "service_tags", "contact_channels", "councils", "triage_routes", "route_conditions",
  "route_targets", "scripts", "evidence_categories", "reconciliation_items", "users",
  "profiles", "field_definitions", "profile_facts", "consent_receipts", "form_contracts",
  "autofill_mappings", "sessions", "audit_events", "login_links", "auth_rate_limits",
  "account_deletion_requests", "evidence_metadata", "action_plans", "plan_actions",
  "cases", "case_events", "case_duties", "case_consents", "case_applications", "case_referrals", "case_decisions",
  "case_deadlines", "case_tasks", "case_evidence", "case_documents", "case_document_versions",
  "advocate_organisations", "professional_roles", "advocate_invitations", "case_access_grants", "case_access_permissions", "suitability_assessments",
  "case_complaints", "case_reviews", "safeguarding_decisions", "case_export_requests",
  "retention_jobs", "break_glass_access", "case_communications", "notification_preferences",
  "operational_release_gates", "pilot_programs", "pilot_approvals", "pilot_cohorts",
  "pilot_participants", "pilot_participant_consents", "pilot_feature_flags", "pilot_feature_flag_history",
  "support_tickets", "operational_incidents", "incident_actions", "pilot_feedback", "pilot_outcomes",
  "partner_organisations", "partner_memberships", "partner_agreements", "service_correction_proposals",
  "launch_checklists", "launch_checklist_items", "operating_cost_models", "operating_cost_items",
  "operational_analytics_events", "commissioner_reports", "operational_releases", "release_approvals",
  "pilot_notification_preferences", "operational_role_assignments",
  "regions", "regional_authorities", "regional_postcode_mappings", "regional_service_coverage",
  "regional_dataset_revisions", "regional_publication_states", "regional_content_overrides",
  "regional_triage_overrides", "regional_governance_owners", "regional_verification_assignments",
  "region_identifier_prefixes", "legacy_identifier_mappings", "phase6_staff_roles",
  "partner_locations", "partner_contacts", "partner_managed_services",
  "service_verification_assessments", "service_verification_dimensions", "service_review_schedules",
  "service_change_impact_reports", "controlled_taxonomy_terms", "content_source_versions",
  "translation_versions", "easy_read_versions", "media_assets", "content_dependencies",
  "accessibility_preferences_phase6", "offline_public_packs", "notification_templates_phase6",
  "phase6_feature_flags", "integration_adapters", "council_adapter_contracts",
  "regional_publication_workflows", "regional_publication_stage_records",
  "aggregate_report_runs", "operational_cost_assumptions",
];

const quote = (identifier) => `"${identifier.replaceAll('"', '""')}"`;

export async function createLogicalBackup(client) {
  const backup = { format: "kent-navigator-logical-v1", createdAt: new Date().toISOString(), tables: {} };
  for (const table of TABLES) backup.tables[table] = (await client.query(`SELECT * FROM ${quote(table)}`)).rows;
  return backup;
}

export async function restoreLogicalBackup(client, backup) {
  if (backup?.format !== "kent-navigator-logical-v1") throw new Error("Unsupported backup format.");
  await client.query("BEGIN");
  try {
    const regionalLinkTrigger = (await client.query("SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='phase6_dataset_revision_link' AND tgrelid='dataset_revisions'::regclass) AS present")).rows[0]?.present === true;
    if (regionalLinkTrigger) await client.query("ALTER TABLE dataset_revisions DISABLE TRIGGER phase6_dataset_revision_link");
    const jsonColumns = new Set((await client.query("SELECT table_name,column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=ANY($1::text[]) AND data_type IN ('json','jsonb')", [TABLES])).rows.map((row) => `${row.table_name}.${row.column_name}`));
    await client.query(`TRUNCATE ${TABLES.map(quote).join(", ")} RESTART IDENTITY CASCADE`);
    for (const table of TABLES) {
      for (const row of backup.tables[table] ?? []) {
        const columns = Object.keys(row);
        if (!columns.length) continue;
        const values = columns.map((column) => {
          const value = row[column];
          return value !== null && jsonColumns.has(`${table}.${column}`) ? JSON.stringify(value) : value;
        });
        await client.query(`INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES (${values.map((_, index) => `$${index + 1}`).join(", ")})`, values);
      }
    }
    if (regionalLinkTrigger) await client.query("ALTER TABLE dataset_revisions ENABLE TRIGGER phase6_dataset_revision_link");
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export { TABLES as LOGICAL_BACKUP_TABLES };
