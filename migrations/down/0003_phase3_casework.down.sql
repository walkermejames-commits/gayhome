BEGIN;
DROP INDEX IF EXISTS audit_resource_time_idx;
DROP TABLE IF EXISTS notification_preferences, case_communications, break_glass_access, retention_jobs, case_export_requests, safeguarding_decisions,
  case_reviews, case_complaints, suitability_assessments, case_consents, case_access_permissions,
  case_access_grants, advocate_invitations, professional_roles, advocate_organisations, case_document_versions, case_documents, case_evidence,
  case_tasks, case_deadlines, case_decisions, case_referrals, case_applications, case_duties, case_events, cases;
COMMIT;
