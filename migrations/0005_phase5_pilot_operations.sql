BEGIN;

CREATE TABLE operational_role_assignments (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  region text,
  pilot_id uuid,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (role IN ('pilot_administrator','support_agent','incident_commander','safeguarding_lead','data_reviewer','partner_administrator','release_manager','commissioner_viewer')),
  CHECK (status IN ('pending','active','suspended','revoked')),
  CHECK (status <> 'active' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE TABLE operational_release_gates (
  id text PRIMARY KEY,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  owner_user_id uuid REFERENCES users(id),
  acceptance_criteria text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  environment_impact text NOT NULL,
  pilot_impact text NOT NULL,
  production_impact text NOT NULL,
  human_approval_required boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('open','blocked','in_progress','technically_complete','awaiting_testing','awaiting_independent_review','awaiting_human_approval','closed','superseded')),
  CHECK (status <> 'closed' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE TABLE pilot_programs (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  region text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  start_date date,
  end_date date,
  maximum_users integer NOT NULL CHECK (maximum_users > 0),
  maximum_professionals integer NOT NULL CHECK (maximum_professionals >= 0),
  features_enabled text[] NOT NULL DEFAULT ARRAY[]::text[],
  support_hours text NOT NULL,
  safeguarding_owner_id uuid REFERENCES users(id),
  technical_owner_id uuid REFERENCES users(id),
  editorial_owner_id uuid REFERENCES users(id),
  data_verification_owner_id uuid REFERENCES users(id),
  support_owner_id uuid REFERENCES users(id),
  incident_owner_id uuid REFERENCES users(id),
  entry_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  exit_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  pause_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  stop_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid REFERENCES users(id),
  CHECK (status IN ('draft','awaiting_approval','approved','scheduled','active','paused','stopped','completed','archived')),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
  CHECK (status NOT IN ('approved','scheduled','active') OR (approved_at IS NOT NULL AND approved_by IS NOT NULL))
);

ALTER TABLE operational_role_assignments
  ADD CONSTRAINT operational_roles_pilot_fk FOREIGN KEY (pilot_id) REFERENCES pilot_programs(id) ON DELETE CASCADE;

CREATE TABLE pilot_approvals (
  id uuid PRIMARY KEY,
  pilot_id uuid NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
  approval_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  decided_by uuid REFERENCES users(id),
  decided_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pilot_id, approval_type),
  CHECK (approval_type IN ('pilot','safeguarding','governance','accessibility','security','data','support','incident','recovery')),
  CHECK (status IN ('pending','approved','rejected','expired','revoked')),
  CHECK (status <> 'approved' OR (decided_by IS NOT NULL AND decided_at IS NOT NULL))
);

CREATE TABLE pilot_cohorts (
  id uuid PRIMARY KEY,
  pilot_id uuid NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  participant_type text NOT NULL,
  maximum_participants integer NOT NULL CHECK (maximum_participants > 0),
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'draft',
  features_available text[] NOT NULL DEFAULT ARRAY[]::text[],
  support_model text NOT NULL,
  consent_version text NOT NULL,
  data_permitted text[] NOT NULL DEFAULT ARRAY[]::text[],
  exit_criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (participant_type IN ('internal_synthetic','lived_experience','professional_partner','supported_real_user','expanded_controlled')),
  CHECK (status IN ('draft','awaiting_approval','approved','active','paused','completed','archived')),
  CHECK (status NOT IN ('approved','active') OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE TABLE pilot_participants (
  id uuid PRIMARY KEY,
  pilot_id uuid NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
  cohort_id uuid NOT NULL REFERENCES pilot_cohorts(id) ON DELETE RESTRICT,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  invitation_hash char(64) NOT NULL UNIQUE,
  eligibility_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'invited',
  safe_contact_encrypted text,
  support_needs_encrypted text,
  accessibility_preferences_encrypted text,
  joined_at timestamptz,
  withdrawn_at timestamptz,
  export_requested_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (eligibility_status IN ('pending','eligible','ineligible','withdrawn')),
  CHECK (status IN ('invited','information_viewed','consented','active','paused','withdrawn','completed','deleted'))
);

CREATE TABLE pilot_participant_consents (
  id uuid PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES pilot_participants(id) ON DELETE CASCADE,
  consent_type text NOT NULL,
  notice_version text NOT NULL,
  granted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_id, consent_type, notice_version),
  CHECK (consent_type IN ('service_use','pilot_participation','optional_feedback','optional_research','optional_post_pilot_contact'))
);

CREATE TABLE pilot_feature_flags (
  id text PRIMARY KEY,
  description text NOT NULL,
  environment text NOT NULL,
  region text,
  pilot_id uuid REFERENCES pilot_programs(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES pilot_cohorts(id) ON DELETE CASCADE,
  default_state boolean NOT NULL DEFAULT false,
  current_state boolean NOT NULL DEFAULT false,
  owner_user_id uuid REFERENCES users(id),
  risk_level text NOT NULL,
  approval_requirement text NOT NULL,
  dependencies text[] NOT NULL DEFAULT ARRAY[]::text[],
  last_changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid REFERENCES users(id),
  change_reason text NOT NULL DEFAULT 'Initial default-deny state',
  review_at timestamptz,
  CHECK (environment IN ('development','test','staging','pilot','production')),
  CHECK (risk_level IN ('low','medium','high','critical')),
  CHECK (default_state = false)
);

CREATE TABLE pilot_feature_flag_history (
  id uuid PRIMARY KEY,
  flag_id text NOT NULL REFERENCES pilot_feature_flags(id) ON DELETE CASCADE,
  previous_state boolean NOT NULL,
  new_state boolean NOT NULL,
  changed_by uuid NOT NULL REFERENCES users(id),
  reason text NOT NULL,
  approvals jsonb NOT NULL DEFAULT '[]'::jsonb,
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_tickets (
  id uuid PRIMARY KEY,
  reporter_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  anonymous_reporter boolean NOT NULL DEFAULT false,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'standard',
  description_encrypted text NOT NULL,
  safe_contact_encrypted text,
  related_case_id uuid REFERENCES cases(id) ON DELETE SET NULL,
  related_service_external_id text,
  related_council_external_id text,
  pilot_id uuid REFERENCES pilot_programs(id) ON DELETE SET NULL,
  assigned_owner_id uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'open',
  response_deadline timestamptz NOT NULL,
  resolution_encrypted text,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (category IN ('technical','accessibility','housing_content','incorrect_service_information','privacy','security','safeguarding','complaint','feature_request','account_access','evidence_problem','consent_sharing')),
  CHECK (severity IN ('critical','high','material','standard')),
  CHECK (status IN ('open','triaged','assigned','waiting_for_reporter','in_progress','resolved','closed'))
);

CREATE TABLE operational_incidents (
  id uuid PRIMARY KEY,
  severity text NOT NULL,
  category text NOT NULL,
  summary text NOT NULL,
  detected_by uuid REFERENCES users(id),
  detected_at timestamptz NOT NULL DEFAULT now(),
  affected_system text NOT NULL,
  affected_records integer NOT NULL DEFAULT 0 CHECK (affected_records >= 0),
  safeguarding_impact text NOT NULL DEFAULT 'none_recorded',
  privacy_impact text NOT NULL DEFAULT 'none_recorded',
  security_impact text NOT NULL DEFAULT 'none_recorded',
  incident_commander_id uuid REFERENCES users(id),
  containment_action text,
  communication_status text NOT NULL DEFAULT 'not_required',
  regulator_assessment text,
  root_cause text,
  remediation text,
  status text NOT NULL DEFAULT 'open',
  closed_at timestamptz,
  post_incident_review jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (severity IN ('p0','p1','p2','p3')),
  CHECK (status IN ('open','contained','monitoring','resolved','closed'))
);

CREATE TABLE incident_actions (
  id uuid PRIMARY KEY,
  incident_id uuid NOT NULL REFERENCES operational_incidents(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  previous_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text NOT NULL,
  performed_by uuid NOT NULL REFERENCES users(id),
  performed_at timestamptz NOT NULL DEFAULT now(),
  CHECK (action_type IN ('disable_feature','pause_registration','disable_evidence','disable_email','disable_advocate_invites','hide_service','pause_pilot','service_notice','rollback_prepared'))
);

CREATE TABLE pilot_feedback (
  id uuid PRIMARY KEY,
  reporter_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  anonymous boolean NOT NULL DEFAULT true,
  category text NOT NULL,
  rating integer CHECK (rating BETWEEN 1 AND 5),
  text_encrypted text,
  related_page text,
  related_service_external_id text,
  related_council_external_id text,
  cohort_id uuid REFERENCES pilot_cohorts(id) ON DELETE SET NULL,
  assigned_owner_id uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'open',
  resolution_encrypted text,
  product_change_reference text,
  tracking_token_hash char(64),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (category IN ('usefulness','accessibility','incorrect_information','complaint','privacy','safeguarding','feature_suggestion','positive_outcome','confusing')),
  CHECK (status IN ('open','triaged','in_progress','resolved','closed'))
);

CREATE TABLE pilot_outcomes (
  id uuid PRIMARY KEY,
  pilot_id uuid NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
  cohort_id uuid REFERENCES pilot_cohorts(id) ON DELETE SET NULL,
  participant_id uuid REFERENCES pilot_participants(id) ON DELETE SET NULL,
  outcome_type text NOT NULL,
  occurred_on date NOT NULL,
  region text NOT NULL,
  source text NOT NULL,
  confidence text NOT NULL DEFAULT 'user_reported',
  optional boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (confidence IN ('user_reported','staff_recorded','system_event','confirmed'))
);

CREATE TABLE partner_organisations (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  partner_type text NOT NULL,
  region text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  primary_contact_encrypted text,
  safeguarding_contact_encrypted text,
  data_protection_contact_encrypted text,
  agreement_status text NOT NULL DEFAULT 'not_started',
  training_status text NOT NULL DEFAULT 'not_started',
  verification_status text NOT NULL DEFAULT 'unverified',
  suspended_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('pending','approved','active','suspended','revoked','archived'))
);

CREATE TABLE partner_memberships (
  id uuid PRIMARY KEY,
  organisation_id uuid NOT NULL REFERENCES partner_organisations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, user_id, role),
  CHECK (role IN ('partner_admin','service_editor','professional','viewer')),
  CHECK (status IN ('pending','active','suspended','revoked'))
);

CREATE TABLE partner_agreements (
  id uuid PRIMARY KEY,
  organisation_id uuid NOT NULL REFERENCES partner_organisations(id) ON DELETE CASCADE,
  agreement_type text NOT NULL,
  version text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organisation_id, agreement_type, version)
);

CREATE TABLE service_correction_proposals (
  id uuid PRIMARY KEY,
  record_type text NOT NULL,
  record_external_id text NOT NULL,
  current_value jsonb NOT NULL,
  proposed_value jsonb NOT NULL,
  reason text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  urgency text NOT NULL DEFAULT 'standard',
  submitted_by uuid REFERENCES users(id),
  partner_organisation_id uuid REFERENCES partner_organisations(id) ON DELETE SET NULL,
  verification_status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid REFERENCES users(id),
  decision text,
  dataset_revision_id uuid REFERENCES dataset_revisions(id),
  published_at timestamptz,
  temporarily_hidden_at timestamptz,
  hidden_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (record_type IN ('service','council')),
  CHECK (urgency IN ('standard','high','critical')),
  CHECK (verification_status IN ('pending','investigating','verified','rejected','published')),
  CHECK (published_at IS NULL OR (verification_status = 'published' AND dataset_revision_id IS NOT NULL AND reviewer_id IS NOT NULL))
);

CREATE TABLE launch_checklists (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  environment text NOT NULL,
  release_version text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (environment IN ('staging','pilot','production')),
  CHECK (status IN ('draft','in_progress','blocked','awaiting_approval','approved','archived'))
);

CREATE TABLE launch_checklist_items (
  id uuid PRIMARY KEY,
  checklist_id uuid NOT NULL REFERENCES launch_checklists(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  owner_user_id uuid REFERENCES users(id),
  status text NOT NULL DEFAULT 'open',
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  risk text NOT NULL,
  approver_id uuid REFERENCES users(id),
  blocking_effect text NOT NULL,
  completed_at timestamptz,
  CHECK (status IN ('open','in_progress','blocked','complete','not_applicable'))
);

CREATE TABLE operating_cost_models (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  scenario text NOT NULL,
  currency char(3) NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (scenario IN ('development','small_controlled_pilot','kent_public_beta','full_kent_medway','regional_expansion'))
);

CREATE TABLE operating_cost_items (
  id uuid PRIMARY KEY,
  model_id uuid NOT NULL REFERENCES operating_cost_models(id) ON DELETE CASCADE,
  category text NOT NULL,
  item text NOT NULL,
  quantity numeric(12,2) NOT NULL CHECK (quantity >= 0),
  unit_cost numeric(14,2) NOT NULL CHECK (unit_cost >= 0),
  frequency text NOT NULL,
  source text NOT NULL,
  source_date date NOT NULL,
  confidence text NOT NULL,
  notes text NOT NULL DEFAULT '',
  CHECK (confidence IN ('low','medium','high','confirmed'))
);

CREATE TABLE operational_analytics_events (
  id uuid PRIMARY KEY,
  pilot_id uuid REFERENCES pilot_programs(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  region text NOT NULL,
  occurred_on date NOT NULL,
  event_count integer NOT NULL DEFAULT 1 CHECK (event_count > 0),
  dimensions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE commissioner_reports (
  id uuid PRIMARY KEY,
  pilot_id uuid NOT NULL REFERENCES pilot_programs(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  minimum_group_size integer NOT NULL DEFAULT 5 CHECK (minimum_group_size >= 5),
  status text NOT NULL DEFAULT 'draft',
  generated_by uuid NOT NULL REFERENCES users(id),
  report_data jsonb NOT NULL,
  limitations jsonb NOT NULL DEFAULT '[]'::jsonb,
  generated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (period_end >= period_start),
  CHECK (status IN ('draft','reviewed','approved','archived'))
);

CREATE TABLE operational_releases (
  id uuid PRIMARY KEY,
  release_version text NOT NULL UNIQUE,
  commit_sha char(40) NOT NULL,
  dataset_revision text NOT NULL,
  migration_level text NOT NULL,
  environment text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  checklist_id uuid REFERENCES launch_checklists(id),
  approver_id uuid REFERENCES users(id),
  release_owner_id uuid REFERENCES users(id),
  rollback_owner_id uuid REFERENCES users(id),
  release_notes text NOT NULL,
  backup_reference text,
  rollback_version text,
  released_at timestamptz,
  rollback_prepared_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (environment IN ('staging','pilot','production')),
  CHECK (status IN ('draft','preflight_blocked','ready_for_approval','approved','released','rollback_prepared','rolled_back','cancelled'))
);

CREATE TABLE release_approvals (
  id uuid PRIMARY KEY,
  release_id uuid NOT NULL REFERENCES operational_releases(id) ON DELETE CASCADE,
  approval_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE(release_id, approval_type),
  CHECK (status IN ('pending','approved','rejected','revoked'))
);

CREATE TABLE pilot_notification_preferences (
  id uuid PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES pilot_participants(id) ON DELETE CASCADE,
  channel text NOT NULL,
  category text NOT NULL,
  wording text NOT NULL DEFAULT 'ultra_neutral',
  enabled boolean NOT NULL DEFAULT false,
  quiet_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_id, channel, category),
  CHECK (channel IN ('in_app','email','sms','push')),
  CHECK (wording IN ('normal','discreet','ultra_neutral')),
  CHECK (channel = 'in_app' OR enabled = false)
);

CREATE INDEX operational_roles_user_idx ON operational_role_assignments(user_id, status, role);
CREATE INDEX pilot_programs_region_status_idx ON pilot_programs(region, status);
CREATE INDEX pilot_cohorts_pilot_status_idx ON pilot_cohorts(pilot_id, status);
CREATE INDEX pilot_participants_cohort_status_idx ON pilot_participants(cohort_id, status);
CREATE INDEX pilot_consents_participant_idx ON pilot_participant_consents(participant_id, consent_type, revoked_at);
CREATE INDEX pilot_flags_scope_idx ON pilot_feature_flags(environment, region, pilot_id, cohort_id);
CREATE INDEX pilot_flag_history_idx ON pilot_feature_flag_history(flag_id, changed_at DESC);
CREATE INDEX support_tickets_queue_idx ON support_tickets(category, severity, status, response_deadline);
CREATE INDEX incidents_queue_idx ON operational_incidents(severity, status, detected_at DESC);
CREATE INDEX feedback_queue_idx ON pilot_feedback(category, status, created_at DESC);
CREATE INDEX outcomes_aggregate_idx ON pilot_outcomes(pilot_id, occurred_on, outcome_type, region);
CREATE INDEX partner_memberships_user_idx ON partner_memberships(user_id, status);
CREATE INDEX correction_queue_idx ON service_correction_proposals(verification_status, urgency, created_at DESC);
CREATE INDEX checklist_items_blocking_idx ON launch_checklist_items(checklist_id, status, blocking_effect);
CREATE INDEX analytics_aggregate_idx ON operational_analytics_events(pilot_id, occurred_on, event_type, region);

INSERT INTO operational_release_gates (id,description,status,acceptance_criteria,environment_impact,pilot_impact,production_impact,human_approval_required) VALUES
  ('PHASE4-INTEGRATION-001','Phase 4 branch requires independent review and approved merge.','awaiting_independent_review','Remote branch and PR reviewed; findings resolved; merge verified.','Blocks release promotion.','Blocks pilot activation.','Blocks production release.',true),
  ('DATA-001','Controlled data requires current verification and approval.','awaiting_human_approval','Critical records are verified from primary sources and approved.','Blocks publication of stale critical records.','Blocks real-user cohorts.','Blocks production publication.',true),
  ('DEPLOY-001','Hosted recovery and rollback require verification.','awaiting_testing','Hosted backup, restore, alerts and rollback pass.','Blocks hosted activation.','Blocks pilot activation.','Blocks production.',true),
  ('AUTH-001','Identity, sessions and keys require operational assurance.','in_progress','Providers, keys and role lifecycle pass independent tests.','Blocks persistent private data.','Blocks real accounts.','Blocks production.',true),
  ('ACCESS-001','Integrated journeys require manual accessibility approval.','awaiting_testing','WCAG 2.2 AA manual and assistive-technology tests pass.','Blocks inaccessible interfaces.','Blocks participant cohorts.','Blocks public launch.',true),
  ('GOV-001','Privacy and governance require accountable approval.','awaiting_human_approval','DPIA, ROPA and policies are approved.','Blocks personal-data processing.','Blocks real participants.','Blocks public release.',true),
  ('CASE-001','Casework requires complete independent assurance.','in_progress','Security, retention and journey tests pass.','Restricts private casework.','Restricts pilot casework.','Blocks production casework.',true),
  ('EVIDENCE-001','Evidence bytes require approved storage and scanning.','open','Storage, scanning, access, restore and deletion pass.','Evidence remains metadata-only.','Evidence upload disabled.','Blocks evidence storage.',true),
  ('SHARE-001','Delegated access requires independent review.','awaiting_independent_review','Consent, expiry, revocation and role boundaries are approved.','Sharing remains limited.','Invitations remain disabled.','Blocks production sharing.',true),
  ('MAIL-001','External communications require approved providers and safety tests.','open','Provider and wrong-recipient controls pass.','External delivery disabled.','External delivery disabled.','Blocks external email.',true),
  ('PDF-001','Exports require privacy and accessibility review.','awaiting_testing','Privacy, injection and assistive-technology tests pass.','Restricts exports.','Synthetic exports only.','Blocks public case packs.',true),
  ('SAFEGUARD-001','Safeguarding requires named trained ownership.','awaiting_human_approval','Lead, deputy, cover and procedures are approved and exercised.','Blocks participant-facing activity.','Blocks every participant cohort.','Blocks public release.',true),
  ('RETENTION-001','Retention and deletion require approved jobs and tests.','in_progress','Schedules and deletion jobs pass end-to-end.','Blocks retained real data.','Blocks real participant data.','Blocks deletion claims.',true),
  ('PENTEST-001','Independent penetration testing is required.','open','Critical and high findings are resolved or formally accepted.','Limits staging promotion.','Limits pilot scope.','Blocks public production.',true),
  ('PHASE3-INTEGRATION-001','Phase 3 integration is technically complete.','technically_complete','Independent review confirms integration evidence.','No local block.','Review required.','Review required.',true),
  ('PHASE5-PILOT-001','Pilot configuration and activation controls require verification.','open','Pilot and cohort journeys pass with default-deny flags.','Blocks pilot environment.','Blocks pilot activation.','Required before production evidence.',true),
  ('PHASE5-SUPPORT-001','Support ownership and accessible channels require approval.','open','Named coverage, response targets and escalation are exercised.','Blocks supported service.','Blocks participant cohorts.','Blocks launch.',true),
  ('PHASE5-INCIDENT-001','Incident response and shutdown controls require exercise.','open','P0/P1 tabletop and shutdown/rollback actions pass.','Blocks operational activation.','Blocks pilot activation.','Blocks launch.',true),
  ('PHASE5-ANALYTICS-001','Aggregate reporting privacy requires review.','open','Small-cell suppression and report privacy receive approval.','Blocks external reporting.','Blocks commissioner reporting.','Blocks public reporting.',true),
  ('PHASE5-PARTNER-001','Partner access requires independent review.','open','Partner boundaries, training and proposal controls pass.','Partner portal remains disabled.','Blocks partner cohort.','Blocks partner launch.',true),
  ('PHASE5-LAUNCH-001','Production launch requires formal approval.','blocked','Every production checklist item and gate is approved.','Blocks production environment.','Does not authorize pilot.','Blocks production.',true),
  ('PHASE5-INTEGRATION-001','Phase 5 branch requires independent review and merge.','open','Branch is reviewed, findings resolved and merge verified.','Blocks release promotion.','Blocks pilot activation.','Blocks production.',true);

INSERT INTO pilot_feature_flags (id,description,environment,default_state,current_state,risk_level,approval_requirement,dependencies) VALUES
  ('pilot.registration','New pilot participant registration','pilot',false,false,'critical','Approved pilot, cohort, owners and gates',ARRAY['PHASE5-PILOT-001','SAFEGUARD-001']),
  ('pilot.accounts','Pilot participant accounts','pilot',false,false,'high','AUTH-001 and GOV-001 approval',ARRAY['AUTH-001','GOV-001']),
  ('pilot.profiles','Persistent pilot profiles','pilot',false,false,'high','AUTH-001, GOV-001 and RETENTION-001 approval',ARRAY['AUTH-001','GOV-001','RETENTION-001']),
  ('pilot.cases','Pilot secure cases','pilot',false,false,'critical','CASE-001 and safeguarding approval',ARRAY['CASE-001','SAFEGUARD-001']),
  ('pilot.evidence','Evidence bytes','pilot',false,false,'critical','EVIDENCE-001 approval',ARRAY['EVIDENCE-001']),
  ('pilot.advocates','Advocate invitations','pilot',false,false,'critical','SHARE-001 approval',ARRAY['SHARE-001']),
  ('pilot.professionals','Professional accounts','pilot',false,false,'critical','Partner and sharing approval',ARRAY['PHASE5-PARTNER-001','SHARE-001']),
  ('pilot.external_email','External email delivery','pilot',false,false,'critical','MAIL-001 approval and provider',ARRAY['MAIL-001']),
  ('pilot.notifications','External notifications','pilot',false,false,'high','MAIL-001 approval and explicit preferences',ARRAY['MAIL-001']),
  ('pilot.feedback','Pilot feedback','pilot',false,false,'medium','Support and governance approval',ARRAY['PHASE5-SUPPORT-001','GOV-001']),
  ('pilot.analytics','Privacy-safe pilot analytics','pilot',false,false,'high','Analytics privacy approval',ARRAY['PHASE5-ANALYTICS-001']),
  ('pilot.partner_portal','Partner portal','pilot',false,false,'critical','Partner independent review',ARRAY['PHASE5-PARTNER-001']),
  ('production.public_access','Production public access','production',false,false,'critical','Formal production launch approval',ARRAY['PHASE5-LAUNCH-001']);

COMMIT;
