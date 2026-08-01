BEGIN;

CREATE TABLE cases (
  id uuid PRIMARY KEY, reference text NOT NULL UNIQUE, owner_user_id uuid NOT NULL REFERENCES users(id),
  title_encrypted text NOT NULL, case_type text NOT NULL, status text NOT NULL, urgency text NOT NULL DEFAULT 'standard',
  council_external_id text, current_area text, opened_at timestamptz NOT NULL DEFAULT now(), closed_at timestamptz,
  safe_contact boolean NOT NULL DEFAULT true, discreet_mode boolean NOT NULL DEFAULT false,
  homelessness_stage text, current_duty text, primary_deadline timestamptz, risk_level text NOT NULL DEFAULT 'not_assessed',
  accessibility_needs_encrypted text, archived_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('draft','active','waiting_for_response','action_required','emergency','under_review','escalated','temporarily_paused','resolved','closed','archived')),
  CHECK (urgency IN ('standard','soon','urgent','immediate'))
);

CREATE TABLE case_events (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, event_at timestamptz NOT NULL,
  event_type text NOT NULL, organisation text, person_contacted text, contact_method text, description_encrypted text NOT NULL,
  outcome_encrypted text, reference_number_encrypted text, follow_up_action_encrypted text, deadline_at timestamptz,
  privacy_classification sensitivity_class NOT NULL DEFAULT 'personal', source text NOT NULL DEFAULT 'user',
  created_by uuid NOT NULL REFERENCES users(id), supersedes_event_id uuid REFERENCES case_events(id),
  approved_by_user_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (source <> 'ai_suggestion' OR approved_by_user_at IS NOT NULL)
);

CREATE TABLE case_duties (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, duty_type text NOT NULL,
  start_date date, expected_end_date date, actual_end_date date, council_external_id text, officer_encrypted text,
  reference_number_encrypted text, notes_encrypted text, dispute_status text, review_deadline timestamptz,
  legal_status text NOT NULL DEFAULT 'user_reported', created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (legal_status IN ('user_reported','appears_under_consideration','document_suggests','confirmed_in_writing','disputed'))
);

CREATE TABLE case_applications (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, kind text NOT NULL,
  destination text NOT NULL, prepared_at timestamptz, submitted_at timestamptz, submission_method text, submitted_by uuid REFERENCES users(id),
  shared_fields text[] NOT NULL DEFAULT ARRAY[]::text[], evidence_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[], consent_id uuid,
  confirmation_received_at timestamptz, reference_number_encrypted text, expected_response_at timestamptz, follow_up_at timestamptz,
  status text NOT NULL DEFAULT 'draft', outcome_encrypted text, rejection_reason_encrypted text, escalation_available text,
  submission_manifest jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('draft','ready_for_review','ready_to_send','submitted','acknowledged','more_information_requested','under_consideration','accepted','refused','closed','escalated','withdrawn'))
);
CREATE TABLE case_referrals (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, referral_type text NOT NULL, destination text NOT NULL,
  status text NOT NULL DEFAULT 'draft', consent_id uuid, submitted_at timestamptz, follow_up_at timestamptz, outcome_encrypted text,
  created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE case_decisions (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, decision_type text NOT NULL, received_at timestamptz,
  decision_encrypted text NOT NULL, reasons_encrypted text, source_document_id uuid, disputed boolean NOT NULL DEFAULT false,
  review_deadline timestamptz, deadline_status text, created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE case_deadlines (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, title text NOT NULL, due_at timestamptz NOT NULL,
  source text NOT NULL, deadline_status text NOT NULL, confidence text NOT NULL, consequence_encrypted text, calculation_rule text,
  source_date date, reminder_schedule jsonb NOT NULL DEFAULT '[]'::jsonb, assigned_user_id uuid REFERENCES users(id), completed_at timestamptz,
  escalation_rule text, created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (deadline_status IN ('confirmed','estimated','suggested_follow_up','user_reminder')),
  CHECK (confidence IN ('low','medium','high','confirmed'))
);

CREATE TABLE case_tasks (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, title text NOT NULL, detail_encrypted text,
  status text NOT NULL DEFAULT 'open', assigned_user_id uuid REFERENCES users(id), due_at timestamptz, created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK (status IN ('open','in_progress','blocked','done','cancelled'))
);

CREATE TABLE case_evidence (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, title_encrypted text NOT NULL,
  original_filename_encrypted text, category text NOT NULL, created_date date, received_date date, source_encrypted text, description_encrypted text,
  sensitivity sensitivity_class NOT NULL DEFAULT 'sensitive', retention_status text NOT NULL DEFAULT 'active', sharing_status text NOT NULL DEFAULT 'private',
  redaction_status text NOT NULL DEFAULT 'none', sha256 char(64), storage_state text NOT NULL DEFAULT 'blocked_pending_gate', object_key_encrypted text,
  mime_type text, byte_size bigint, malware_scan_status text NOT NULL DEFAULT 'not_scanned', uploaded_by uuid NOT NULL REFERENCES users(id),
  parent_evidence_id uuid REFERENCES case_evidence(id), deleted_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (storage_state IN ('blocked_pending_gate','quarantined','available','deleted')),
  CHECK (malware_scan_status IN ('not_scanned','pending','clean','rejected','error')),
  CHECK (object_key_encrypted IS NULL OR (storage_state = 'available' AND malware_scan_status = 'clean'))
);

CREATE TABLE case_documents (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, document_type text NOT NULL,
  template_id text NOT NULL, template_version text NOT NULL, title text NOT NULL, status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('draft','reviewed','approved','submitted','superseded'))
);
CREATE TABLE case_document_versions (
  id uuid PRIMARY KEY, document_id uuid NOT NULL REFERENCES case_documents(id) ON DELETE CASCADE, version integer NOT NULL,
  body_encrypted text NOT NULL, profile_fields text[] NOT NULL DEFAULT ARRAY[]::text[], case_fields text[] NOT NULL DEFAULT ARRAY[]::text[],
  evidence_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[], consent_id uuid, approved_at timestamptz, created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(document_id, version)
);

CREATE TABLE advocate_organisations (
  id uuid PRIMARY KEY, name text NOT NULL, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status IN ('pending','verified','suspended','closed'))
);
CREATE TABLE professional_roles (
  id uuid PRIMARY KEY, user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, organisation_id uuid REFERENCES advocate_organisations(id),
  role text NOT NULL, status text NOT NULL DEFAULT 'pending', verified_at timestamptz, expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, organisation_id, role), CHECK (role IN ('advocate','professional','administrator','safeguarding_reviewer')),
  CHECK (status IN ('pending','active','suspended','revoked'))
);

CREATE TABLE advocate_invitations (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, invited_by uuid NOT NULL REFERENCES users(id),
  invitee_email_hash char(64) NOT NULL, invitee_email_encrypted text NOT NULL, helper_type text NOT NULL, token_hash char(64) NOT NULL UNIQUE,
  starts_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL, accepted_by uuid REFERENCES users(id), accepted_at timestamptz,
  revoked_at timestamptz, suspended_at timestamptz, requested_permissions text[] NOT NULL DEFAULT ARRAY[]::text[],
  requested_sensitive_categories sensitivity_class[] NOT NULL DEFAULT ARRAY[]::sensitivity_class[], consent_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE case_access_grants (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, grantee_user_id uuid NOT NULL REFERENCES users(id),
  invitation_id uuid REFERENCES advocate_invitations(id), starts_at timestamptz NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz,
  suspended_at timestamptz, last_accessed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(case_id, grantee_user_id)
);
CREATE TABLE case_access_permissions (
  grant_id uuid NOT NULL REFERENCES case_access_grants(id) ON DELETE CASCADE, permission text NOT NULL,
  resource_id uuid, sensitivity sensitivity_class,
  UNIQUE NULLS NOT DISTINCT(grant_id, permission, resource_id, sensitivity)
);

CREATE TABLE case_consents (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, owner_user_id uuid NOT NULL REFERENCES users(id),
  recipient text NOT NULL, purpose text NOT NULL, field_keys text[] NOT NULL DEFAULT ARRAY[]::text[], document_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  permitted_actions text[] NOT NULL DEFAULT ARRAY[]::text[], starts_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
  contact_channel text, onward_sharing boolean NOT NULL DEFAULT false, include_new_information boolean NOT NULL DEFAULT false,
  revoked_at timestamptz, revocation_method text, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE advocate_invitations ADD CONSTRAINT advocate_invitations_consent_id_fkey FOREIGN KEY (consent_id) REFERENCES case_consents(id);
ALTER TABLE case_access_grants ADD COLUMN consent_id uuid REFERENCES case_consents(id);
ALTER TABLE case_applications ADD CONSTRAINT case_applications_consent_id_fkey FOREIGN KEY (consent_id) REFERENCES case_consents(id);
ALTER TABLE case_document_versions ADD CONSTRAINT case_document_versions_consent_id_fkey FOREIGN KEY (consent_id) REFERENCES case_consents(id);

CREATE TABLE suitability_assessments (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, accommodation_address_encrypted text,
  offered_at timestamptz, assessment jsonb NOT NULL, urgent_risks text[] NOT NULL DEFAULT ARRAY[]::text[], user_view_encrypted text,
  status text NOT NULL DEFAULT 'draft', created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE case_complaints (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, route text NOT NULL, status text NOT NULL DEFAULT 'draft',
  destination text, deadline_at timestamptz, summary_encrypted text NOT NULL, submitted_at timestamptz, outcome_encrypted text,
  created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE case_reviews (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, decision_type text NOT NULL, decision_received_at timestamptz,
  in_writing boolean, reasons_encrypted text, contradictory_evidence_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[], deadline_at timestamptz,
  deadline_status text NOT NULL DEFAULT 'estimated', delay_reason_encrypted text, status text NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE safeguarding_decisions (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE RESTRICT, decision_maker uuid NOT NULL REFERENCES users(id),
  legal_or_safeguarding_basis text NOT NULL, information_shared_encrypted text NOT NULL, recipient text NOT NULL, reason_encrypted text NOT NULL,
  decided_at timestamptz NOT NULL, review_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'awaiting_review', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE case_export_requests (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, requested_by uuid NOT NULL REFERENCES users(id),
  export_type text NOT NULL, manifest jsonb NOT NULL, status text NOT NULL DEFAULT 'pending', generated_at timestamptz, expires_at timestamptz,
  object_key_encrypted text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE case_communications (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE, channel text NOT NULL, recipient text NOT NULL,
  subject_encrypted text, body_encrypted text NOT NULL, attachment_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[], consent_id uuid REFERENCES case_consents(id),
  status text NOT NULL DEFAULT 'draft', external_message_id text, approved_at timestamptz, sent_at timestamptz, created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(), CHECK (status IN ('draft','reviewed','copied','downloaded','recorded_external','sent_verified','failed')),
  CHECK (status NOT IN ('sent_verified') OR (approved_at IS NOT NULL AND external_message_id IS NOT NULL))
);
CREATE TABLE notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, channels text[] NOT NULL DEFAULT ARRAY[]::text[],
  categories text[] NOT NULL DEFAULT ARRAY[]::text[], wording text NOT NULL DEFAULT 'neutral', quiet_hours jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(), CHECK (wording IN ('neutral','minimal'))
);
CREATE TABLE retention_jobs (
  id uuid PRIMARY KEY, resource_type text NOT NULL, resource_id uuid NOT NULL, action text NOT NULL, due_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled', legal_hold_reason text, completed_at timestamptz, deletion_log jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE break_glass_access (
  id uuid PRIMARY KEY, case_id uuid NOT NULL REFERENCES cases(id) ON DELETE RESTRICT, actor_id uuid NOT NULL REFERENCES users(id),
  reason text NOT NULL, authorised_by uuid NOT NULL REFERENCES users(id), starts_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
  data_scope text[] NOT NULL, review_outcome text, reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX cases_owner_status_idx ON cases(owner_user_id, status);
CREATE INDEX case_events_case_time_idx ON case_events(case_id, event_at DESC);
CREATE INDEX case_deadlines_case_due_idx ON case_deadlines(case_id, due_at) WHERE completed_at IS NULL;
CREATE INDEX case_applications_case_status_idx ON case_applications(case_id, status);
CREATE INDEX case_referrals_case_status_idx ON case_referrals(case_id, status);
CREATE INDEX case_decisions_case_time_idx ON case_decisions(case_id, received_at DESC);
CREATE INDEX case_evidence_case_idx ON case_evidence(case_id) WHERE deleted_at IS NULL;
CREATE INDEX case_grants_active_idx ON case_access_grants(case_id, grantee_user_id, expires_at) WHERE revoked_at IS NULL AND suspended_at IS NULL;
CREATE INDEX case_consents_active_idx ON case_consents(case_id, expires_at) WHERE revoked_at IS NULL;
CREATE INDEX audit_resource_time_idx ON audit_events(resource_type, resource_id, occurred_at DESC);
CREATE INDEX retention_due_idx ON retention_jobs(due_at) WHERE status = 'scheduled';

COMMIT;
