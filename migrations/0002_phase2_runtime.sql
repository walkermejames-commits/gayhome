BEGIN;

ALTER TABLE services ADD COLUMN access_modes text[] NOT NULL DEFAULT ARRAY[]::text[];

CREATE TABLE users (
  id uuid PRIMARY KEY,
  email_hash char(64) NOT NULL UNIQUE,
  email_encrypted text NOT NULL,
  email_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  disabled_at timestamptz,
  deletion_due_at timestamptz
);

ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE profile_facts ADD COLUMN save_preference text NOT NULL DEFAULT 'save' CHECK (save_preference IN ('save', 'use_once'));
ALTER TABLE profile_facts ADD COLUMN excluded_from_autofill boolean NOT NULL DEFAULT false;
ALTER TABLE profile_facts ADD COLUMN sharing_restricted boolean NOT NULL DEFAULT false;
ALTER TABLE profile_facts ADD COLUMN marked_outdated_at timestamptz;

CREATE TABLE login_links (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  request_event_id uuid NOT NULL,
  requested_ip_hash char(64)
);

CREATE TABLE auth_rate_limits (
  key_hash char(64) PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  attempts integer NOT NULL,
  blocked_until timestamptz
);

CREATE TABLE account_deletion_requests (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  requested_at timestamptz NOT NULL,
  due_at timestamptz NOT NULL,
  cancelled_at timestamptz,
  completed_at timestamptz,
  retention_exceptions jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE evidence_metadata (
  id uuid PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  evidence_category_id uuid REFERENCES evidence_categories(id),
  label_encrypted text NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'requested', 'unavailable', 'preparing')),
  storage_mode text NOT NULL CHECK (storage_mode IN ('session_only', 'local_preparation', 'encrypted_object')),
  object_key_encrypted text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE action_plans (
  id uuid PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE plan_actions (
  id uuid PRIMARY KEY,
  action_plan_id uuid NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
  phase text NOT NULL CHECK (phase IN ('now', 'today', 'next_few_days', 'if_refused', 'safety')),
  title text NOT NULL,
  reason text NOT NULL,
  destination_external_id text,
  contact_method text,
  suggested_script_id text,
  evidence_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  expected_response text,
  follow_up_at timestamptz,
  escalation_route text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'postponed')),
  note_encrypted text,
  source_order integer NOT NULL
);

COMMIT;
