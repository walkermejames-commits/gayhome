BEGIN;

CREATE TYPE dataset_import_status AS ENUM ('quarantined', 'validated', 'review_required', 'approved', 'published', 'rejected');
CREATE TYPE record_status AS ENUM ('draft', 'quarantined', 'verified', 'archived');
CREATE TYPE contact_channel_type AS ENUM ('telephone', 'email', 'webchat', 'sms', 'whatsapp', 'drop_in', 'online_form', 'referral_portal', 'website');
CREATE TYPE contact_channel_status AS ENUM ('active', 'limited', 'transitioning', 'existing_users_only', 'temporarily_unavailable', 'retired', 'unverified');
CREATE TYPE public_display_rule AS ENUM ('show', 'show_with_warning', 'hide', 'staff_only');
CREATE TYPE sensitivity_class AS ENUM ('public', 'personal', 'sensitive', 'special_category', 'criminal_offence', 'safeguarding');
CREATE TYPE session_mode AS ENUM ('guest', 'private_device', 'public_device');

CREATE TABLE dataset_imports (
  id uuid PRIMARY KEY,
  file_sha256 char(64) NOT NULL,
  parser_version text NOT NULL,
  import_kind text NOT NULL CHECK (import_kind IN ('json', 'workbook')),
  source_filename text NOT NULL,
  status dataset_import_status NOT NULL DEFAULT 'quarantined',
  uploaded_by uuid,
  imported_at timestamptz NOT NULL DEFAULT now(),
  raw_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (file_sha256, parser_version, import_kind)
);

CREATE TABLE dataset_revisions (
  id uuid PRIMARY KEY,
  external_version text NOT NULL UNIQUE,
  parent_revision_id uuid REFERENCES dataset_revisions(id),
  reason text NOT NULL,
  effective_at timestamptz NOT NULL,
  published_at timestamptz,
  is_active boolean NOT NULL DEFAULT false,
  created_from_import_id uuid NOT NULL REFERENCES dataset_imports(id)
);
CREATE UNIQUE INDEX one_active_dataset_revision ON dataset_revisions (is_active) WHERE is_active;

CREATE TABLE sources (
  id uuid PRIMARY KEY,
  external_id text NOT NULL,
  dataset_revision_id uuid NOT NULL REFERENCES dataset_revisions(id),
  name text NOT NULL,
  url text NOT NULL,
  publisher_type text NOT NULL,
  verified_on date NOT NULL,
  review_after_days integer NOT NULL CHECK (review_after_days > 0),
  notes text NOT NULL DEFAULT '',
  status record_status NOT NULL DEFAULT 'quarantined',
  UNIQUE (dataset_revision_id, external_id)
);

CREATE TABLE source_verifications (
  id uuid PRIMARY KEY,
  source_id uuid NOT NULL REFERENCES sources(id),
  checked_at timestamptz NOT NULL,
  method text NOT NULL,
  outcome text NOT NULL,
  checked_by uuid,
  evidence_url text,
  next_review_date date NOT NULL,
  notes text NOT NULL DEFAULT ''
);

CREATE TABLE services (
  id uuid PRIMARY KEY,
  external_id text NOT NULL,
  dataset_revision_id uuid NOT NULL REFERENCES dataset_revisions(id),
  source_id uuid NOT NULL REFERENCES sources(id),
  name text NOT NULL,
  provider text NOT NULL,
  service_type text NOT NULL,
  coverage text NOT NULL,
  ages text NOT NULL,
  hours text NOT NULL,
  referral text NOT NULL,
  lgbtq_focus text NOT NULL,
  urgency text NOT NULL,
  notes text NOT NULL,
  verified_on date NOT NULL,
  status record_status NOT NULL DEFAULT 'quarantined',
  UNIQUE (dataset_revision_id, external_id)
);

CREATE TABLE service_tags (
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  tag text NOT NULL,
  source_order integer NOT NULL,
  PRIMARY KEY (service_id, tag)
);

CREATE TABLE contact_channels (
  id uuid PRIMARY KEY,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  channel_type contact_channel_type NOT NULL,
  value text NOT NULL,
  status contact_channel_status NOT NULL,
  valid_from date,
  valid_until date,
  last_verified date NOT NULL,
  intended_audience text NOT NULL DEFAULT 'all',
  new_users_accepted boolean NOT NULL,
  existing_users_accepted boolean NOT NULL,
  public_display_rule public_display_rule NOT NULL,
  replacement_route text,
  transition_note text,
  source_order integer NOT NULL,
  UNIQUE (service_id, channel_type, value)
);

CREATE TABLE councils (
  id uuid PRIMARY KEY,
  external_id text NOT NULL,
  dataset_revision_id uuid NOT NULL REFERENCES dataset_revisions(id),
  source_id uuid NOT NULL REFERENCES sources(id),
  name text NOT NULL,
  area text NOT NULL,
  homelessness_url text NOT NULL,
  phone text NOT NULL,
  hours_notes text NOT NULL,
  route_notes text NOT NULL,
  verified_on date NOT NULL,
  status record_status NOT NULL DEFAULT 'quarantined',
  UNIQUE (dataset_revision_id, external_id)
);

CREATE TABLE triage_routes (
  id uuid PRIMARY KEY,
  external_id text NOT NULL,
  dataset_revision_id uuid NOT NULL REFERENCES dataset_revisions(id),
  trigger_name text NOT NULL,
  recommended_action text NOT NULL,
  urgency text NOT NULL,
  safety_note text NOT NULL,
  verified_on date NOT NULL,
  status record_status NOT NULL DEFAULT 'quarantined',
  UNIQUE (dataset_revision_id, external_id)
);

CREATE TABLE route_conditions (
  route_id uuid NOT NULL REFERENCES triage_routes(id) ON DELETE CASCADE,
  condition_tag text NOT NULL,
  source_order integer NOT NULL,
  PRIMARY KEY (route_id, condition_tag)
);

CREATE TABLE route_targets (
  route_id uuid NOT NULL REFERENCES triage_routes(id) ON DELETE CASCADE,
  target_external_id text NOT NULL,
  target_kind text NOT NULL CHECK (target_kind IN ('service', 'council', 'resolver')),
  source_order integer NOT NULL,
  PRIMARY KEY (route_id, source_order)
);

CREATE TABLE scripts (
  id uuid PRIMARY KEY,
  external_id text NOT NULL,
  dataset_revision_id uuid NOT NULL REFERENCES dataset_revisions(id),
  title text NOT NULL,
  audience text NOT NULL,
  script_text text NOT NULL,
  use_note text NOT NULL,
  status record_status NOT NULL DEFAULT 'quarantined',
  UNIQUE (dataset_revision_id, external_id)
);

CREATE TABLE evidence_categories (
  id uuid PRIMARY KEY,
  external_id text NOT NULL,
  dataset_revision_id uuid NOT NULL REFERENCES dataset_revisions(id),
  area text NOT NULL,
  useful_evidence text NOT NULL,
  safety_note text NOT NULL,
  status record_status NOT NULL DEFAULT 'quarantined',
  UNIQUE (dataset_revision_id, external_id)
);

CREATE TABLE reconciliation_items (
  id uuid PRIMARY KEY,
  import_id uuid NOT NULL REFERENCES dataset_imports(id),
  collection_name text NOT NULL,
  external_id text NOT NULL,
  field_name text,
  current_value jsonb,
  proposed_value jsonb,
  classification text NOT NULL,
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz
);

CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  user_id uuid,
  session_mode session_mode NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE field_definitions (
  id uuid PRIMARY KEY,
  semantic_key text NOT NULL UNIQUE,
  data_type text NOT NULL,
  sensitivity sensitivity_class NOT NULL,
  allowed_purposes text[] NOT NULL,
  freshness_days integer,
  explicit_review_required boolean NOT NULL DEFAULT false,
  save_allowed boolean NOT NULL DEFAULT true
);

CREATE TABLE profile_facts (
  id uuid PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  field_definition_id uuid NOT NULL REFERENCES field_definitions(id),
  value_encrypted text NOT NULL,
  provenance jsonb NOT NULL,
  confirmed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  superseded_at timestamptz,
  UNIQUE (profile_id, field_definition_id, superseded_at)
);

CREATE TABLE consent_receipts (
  id uuid PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id),
  actor_id uuid,
  recipient text NOT NULL,
  purpose text NOT NULL,
  field_definition_ids uuid[] NOT NULL,
  channel text NOT NULL,
  granted_at timestamptz NOT NULL,
  expires_at timestamptz,
  revoked_at timestamptz,
  notice_version text NOT NULL
);

CREATE TABLE form_contracts (
  id uuid PRIMARY KEY,
  external_id text NOT NULL,
  version text NOT NULL,
  title text NOT NULL,
  purpose text NOT NULL,
  review_required boolean NOT NULL DEFAULT true,
  UNIQUE (external_id, version)
);

CREATE TABLE autofill_mappings (
  form_contract_id uuid NOT NULL REFERENCES form_contracts(id) ON DELETE CASCADE,
  form_field_key text NOT NULL,
  field_definition_id uuid NOT NULL REFERENCES field_definitions(id),
  required boolean NOT NULL,
  allow_one_time_value boolean NOT NULL DEFAULT true,
  source_order integer NOT NULL,
  PRIMARY KEY (form_contract_id, form_field_key)
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  user_id uuid,
  profile_id uuid REFERENCES profiles(id),
  mode session_mode NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  rotated_from uuid REFERENCES sessions(id)
);

CREATE TABLE audit_events (
  id uuid PRIMARY KEY,
  actor_id uuid,
  event_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

COMMIT;
