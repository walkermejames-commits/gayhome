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
    await client.query(`TRUNCATE ${TABLES.map(quote).join(", ")} RESTART IDENTITY CASCADE`);
    for (const table of TABLES) {
      for (const row of backup.tables[table] ?? []) {
        const columns = Object.keys(row);
        if (!columns.length) continue;
        const values = columns.map((column) => row[column]);
        await client.query(`INSERT INTO ${quote(table)} (${columns.map(quote).join(", ")}) VALUES (${values.map((_, index) => `$${index + 1}`).join(", ")})`, values);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export { TABLES as LOGICAL_BACKUP_TABLES };
