BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pilot_programs WHERE status IN ('active','paused')) THEN
    RAISE EXCEPTION 'Cannot roll back Phase 5 while a pilot is active or paused';
  END IF;
  IF EXISTS (SELECT 1 FROM operational_releases WHERE status IN ('released','rollback_prepared')) THEN
    RAISE EXCEPTION 'Cannot roll back Phase 5 while a release record is live';
  END IF;
END $$;

DROP TABLE IF EXISTS pilot_notification_preferences;
DROP TABLE IF EXISTS release_approvals;
DROP TABLE IF EXISTS operational_releases;
DROP TABLE IF EXISTS commissioner_reports;
DROP TABLE IF EXISTS operational_analytics_events;
DROP TABLE IF EXISTS operating_cost_items;
DROP TABLE IF EXISTS operating_cost_models;
DROP TABLE IF EXISTS launch_checklist_items;
DROP TABLE IF EXISTS launch_checklists;
DROP TABLE IF EXISTS service_correction_proposals;
DROP TABLE IF EXISTS partner_agreements;
DROP TABLE IF EXISTS partner_memberships;
DROP TABLE IF EXISTS partner_organisations;
DROP TABLE IF EXISTS pilot_outcomes;
DROP TABLE IF EXISTS pilot_feedback;
DROP TABLE IF EXISTS incident_actions;
DROP TABLE IF EXISTS operational_incidents;
DROP TABLE IF EXISTS support_tickets;
DROP TABLE IF EXISTS pilot_feature_flag_history;
DROP TABLE IF EXISTS pilot_feature_flags;
DROP TABLE IF EXISTS pilot_participant_consents;
DROP TABLE IF EXISTS pilot_participants;
DROP TABLE IF EXISTS pilot_cohorts;
DROP TABLE IF EXISTS pilot_approvals;
DROP TABLE IF EXISTS operational_role_assignments;
DROP TABLE IF EXISTS pilot_programs;
DROP TABLE IF EXISTS operational_release_gates;

COMMIT;
