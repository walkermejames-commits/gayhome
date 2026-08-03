BEGIN;

CREATE TABLE regions (
  id text PRIMARY KEY, parent_id text REFERENCES regions(id), name text NOT NULL, geography_type text NOT NULL,
  country text NOT NULL, nation text NOT NULL, legal_jurisdiction text NOT NULL, public_status text NOT NULL DEFAULT 'blocked',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (geography_type IN ('country','nation','region','county','unitary_authority','district','borough','ward')),
  CHECK (public_status IN ('published','preparing','blocked','retired'))
);
CREATE TABLE regional_authorities (
  id uuid PRIMARY KEY, region_id text NOT NULL REFERENCES regions(id), stable_id text NOT NULL UNIQUE, name text NOT NULL,
  authority_type text NOT NULL, legacy_display_coverage text, active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX regional_authorities_region_idx ON regional_authorities(region_id, active);
CREATE TABLE regional_postcode_mappings (outcode text NOT NULL, authority_id uuid NOT NULL REFERENCES regional_authorities(id), source_reference text NOT NULL, verified_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'draft', PRIMARY KEY(outcode,authority_id));
CREATE TABLE regional_service_coverage (service_external_id text NOT NULL, region_id text NOT NULL REFERENCES regions(id), authority_id uuid REFERENCES regional_authorities(id), coverage_type text NOT NULL, display_coverage text, source_reference text NOT NULL, verified_at timestamptz, PRIMARY KEY(service_external_id,region_id,coverage_type));
CREATE TABLE regional_dataset_revisions (
  id uuid PRIMARY KEY, region_id text NOT NULL REFERENCES regions(id), revision text NOT NULL, source_dataset_revision_id uuid REFERENCES dataset_revisions(id),
  state text NOT NULL DEFAULT 'draft', manifest jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
  UNIQUE(region_id, revision), CHECK (state IN ('draft','validating','quarantined','review','approved','published','rolled_back'))
);
CREATE TABLE regional_publication_states (
  region_id text PRIMARY KEY REFERENCES regions(id), dataset_revision_id uuid REFERENCES regional_dataset_revisions(id), stage text NOT NULL DEFAULT 'draft_import',
  blocked boolean NOT NULL DEFAULT true, blocking_issues jsonb NOT NULL DEFAULT '[]'::jsonb, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE regional_content_overrides (id uuid PRIMARY KEY, region_id text NOT NULL REFERENCES regions(id), content_key text NOT NULL, source_version text NOT NULL, value jsonb NOT NULL, status text NOT NULL DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(region_id,content_key,source_version));
CREATE TABLE regional_triage_overrides (id uuid PRIMARY KEY, region_id text NOT NULL REFERENCES regions(id), route_key text NOT NULL, configuration jsonb NOT NULL, status text NOT NULL DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(region_id,route_key));
CREATE TABLE regional_governance_owners (id uuid PRIMARY KEY, region_id text NOT NULL REFERENCES regions(id), responsibility text NOT NULL, owner_reference text NOT NULL, status text NOT NULL DEFAULT 'unassigned', reviewed_at timestamptz, UNIQUE(region_id,responsibility));
CREATE TABLE regional_verification_assignments (id uuid PRIMARY KEY, region_id text NOT NULL REFERENCES regions(id), subject_type text NOT NULL, subject_id text NOT NULL, assignee_user_id uuid REFERENCES users(id), status text NOT NULL DEFAULT 'unassigned', due_at timestamptz, UNIQUE(region_id,subject_type,subject_id));

CREATE TABLE region_identifier_prefixes (region_id text NOT NULL REFERENCES regions(id), entity_type text NOT NULL, prefix text NOT NULL UNIQUE, PRIMARY KEY(region_id,entity_type));
CREATE TABLE legacy_identifier_mappings (legacy_id text PRIMARY KEY, entity_type text NOT NULL, region_id text REFERENCES regions(id), current_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), CHECK(legacy_id <> current_id));

CREATE TABLE phase6_staff_roles (user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, role text NOT NULL, region_id text REFERENCES regions(id), status text NOT NULL DEFAULT 'active', expires_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(user_id,role), CHECK(role IN ('data_steward','commissioner','regional_reviewer')), CHECK(status IN ('active','suspended','revoked')));
CREATE TABLE partner_locations (id uuid PRIMARY KEY, organisation_id uuid NOT NULL REFERENCES partner_organisations(id) ON DELETE CASCADE, region_id text NOT NULL REFERENCES regions(id), public_address text, coverage jsonb NOT NULL DEFAULT '[]'::jsonb);
CREATE TABLE partner_contacts (id uuid PRIMARY KEY, organisation_id uuid NOT NULL REFERENCES partner_organisations(id) ON DELETE CASCADE, contact_type text NOT NULL, contact_encrypted text NOT NULL, purpose text NOT NULL, accessibility_contact boolean NOT NULL DEFAULT false, safeguarding_contact boolean NOT NULL DEFAULT false);
CREATE TABLE partner_managed_services (organisation_id uuid NOT NULL REFERENCES partner_organisations(id) ON DELETE CASCADE, service_external_id text NOT NULL, management_status text NOT NULL DEFAULT 'proposed', verified_at timestamptz, PRIMARY KEY(organisation_id,service_external_id), UNIQUE(service_external_id), CHECK(management_status IN ('proposed','verified','suspended','revoked')));

CREATE TABLE service_verification_assessments (id uuid PRIMARY KEY, service_external_id text NOT NULL, region_id text NOT NULL REFERENCES regions(id), method text NOT NULL, outcome text NOT NULL, evidence_reference text, reviewer_id uuid REFERENCES users(id), reviewed_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz, CHECK(outcome IN ('confirmed','confirmed_with_limitations','changed','temporarily_unavailable','unable_to_verify','conflicting_evidence','closed','superseded')));
CREATE TABLE service_verification_dimensions (assessment_id uuid NOT NULL REFERENCES service_verification_assessments(id) ON DELETE CASCADE, dimension text NOT NULL, confidence smallint NOT NULL, notes text, PRIMARY KEY(assessment_id,dimension), CHECK(confidence BETWEEN 0 AND 100));
CREATE TABLE service_review_schedules (id uuid PRIMARY KEY, service_external_id text NOT NULL, region_id text NOT NULL REFERENCES regions(id), risk_score integer NOT NULL, priority text NOT NULL, due_at timestamptz NOT NULL, signals jsonb NOT NULL, status text NOT NULL DEFAULT 'due', UNIQUE(region_id,service_external_id));
CREATE INDEX service_review_due_idx ON service_review_schedules(status,due_at,priority);
CREATE TABLE service_change_impact_reports (id uuid PRIMARY KEY, service_external_id text NOT NULL, changed_fields text[] NOT NULL, dependencies jsonb NOT NULL, potentially_affected_count integer, cached_content_affected boolean NOT NULL, required_revalidation text[] NOT NULL, rollback_plan text NOT NULL, contains_user_identity boolean NOT NULL DEFAULT false, publication_blocked boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), CHECK(contains_user_identity=false));

CREATE TABLE controlled_taxonomy_terms (id uuid PRIMARY KEY, vocabulary text NOT NULL, canonical_term text NOT NULL, aliases text[] NOT NULL DEFAULT ARRAY[]::text[], regional_terms jsonb NOT NULL DEFAULT '{}'::jsonb, deprecated boolean NOT NULL DEFAULT false, sensitive boolean NOT NULL DEFAULT false, UNIQUE(vocabulary,canonical_term));
CREATE TABLE content_source_versions (id uuid PRIMARY KEY, content_key text NOT NULL, language text NOT NULL DEFAULT 'en', version text NOT NULL, risk_category text NOT NULL DEFAULT 'standard', body text NOT NULL, status text NOT NULL DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(content_key,language,version));
CREATE TABLE translation_versions (id uuid PRIMARY KEY, source_content_id uuid NOT NULL REFERENCES content_source_versions(id), target_language text NOT NULL, direction text NOT NULL DEFAULT 'ltr', translator_reference text, reviewer_reference text, legal_review_status text NOT NULL DEFAULT 'not_required', safeguarding_review_status text NOT NULL DEFAULT 'not_required', publication_status text NOT NULL DEFAULT 'draft', expires_at timestamptz, supersedes_id uuid REFERENCES translation_versions(id), body text NOT NULL, machine_draft boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), CHECK(direction IN ('ltr','rtl')));
CREATE TABLE easy_read_versions (id uuid PRIMARY KEY, source_content_id uuid NOT NULL REFERENCES content_source_versions(id), status text NOT NULL DEFAULT 'draft', body jsonb NOT NULL, reviewer_reference text, supersedes_id uuid REFERENCES easy_read_versions(id), created_at timestamptz NOT NULL DEFAULT now(), CHECK(status IN ('draft','plain_language_reviewed','easy_read_reviewed','lived_experience_reviewed','approved','superseded')));
CREATE TABLE media_assets (id uuid PRIMARY KEY, source_content_id uuid NOT NULL REFERENCES content_source_versions(id), media_type text NOT NULL, asset_reference text NOT NULL, transcript_reference text, captions_reference text, audio_description_reference text, presenter_information text, status text NOT NULL DEFAULT 'placeholder', expires_at timestamptz, supersedes_id uuid REFERENCES media_assets(id), CHECK(status IN ('placeholder','sandbox','review','approved','expired','replaced')));
CREATE TABLE content_dependencies (source_content_id uuid NOT NULL REFERENCES content_source_versions(id), derivative_type text NOT NULL, derivative_id uuid NOT NULL, source_version text NOT NULL, current boolean NOT NULL DEFAULT true, critical boolean NOT NULL DEFAULT false, PRIMARY KEY(source_content_id,derivative_type,derivative_id));

CREATE TABLE accessibility_preferences_phase6 (user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, preferences jsonb NOT NULL DEFAULT '{}'::jsonb, sharing_consent jsonb NOT NULL DEFAULT '{}'::jsonb, updated_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE offline_public_packs (id uuid PRIMARY KEY, region_id text NOT NULL REFERENCES regions(id), dataset_revision_id uuid NOT NULL REFERENCES regional_dataset_revisions(id), generated_at timestamptz NOT NULL, expires_at timestamptz NOT NULL, public_manifest jsonb NOT NULL, contains_private_data boolean NOT NULL DEFAULT false, status text NOT NULL DEFAULT 'draft', CHECK(contains_private_data=false));
CREATE TABLE notification_templates_phase6 (id text PRIMARY KEY, purpose text NOT NULL, sensitivity text NOT NULL, allowed_channels text[] NOT NULL, variables text[] NOT NULL, normal_text text NOT NULL, discreet_text text NOT NULL, ultra_neutral_text text NOT NULL, approval_status text NOT NULL DEFAULT 'draft', translation_status text NOT NULL DEFAULT 'not_started', CHECK(NOT (ultra_neutral_text ~* '(case|homeless|housing|evidence|council|abuse|refuge|application)')));

CREATE TABLE phase6_feature_flags (id text PRIMARY KEY, description text NOT NULL, region_id text REFERENCES regions(id), environment text NOT NULL, default_state boolean NOT NULL DEFAULT false, owner text NOT NULL, approval_requirement text NOT NULL, dependencies text[] NOT NULL DEFAULT ARRAY[]::text[], risk_level text NOT NULL, review_date date, audit_history jsonb NOT NULL DEFAULT '[]'::jsonb, CHECK(default_state=false));
CREATE TABLE integration_adapters (id text PRIMARY KEY, adapter_type text NOT NULL, state text NOT NULL DEFAULT 'disabled', configuration_reference text, timeout_ms integer NOT NULL DEFAULT 5000, max_retries smallint NOT NULL DEFAULT 0, circuit_state text NOT NULL DEFAULT 'closed', data_allowlist text[] NOT NULL DEFAULT ARRAY[]::text[], last_health_check timestamptz, CHECK(state IN ('disabled','sandbox','test','production')));
CREATE TABLE council_adapter_contracts (id text PRIMARY KEY, authority_id uuid REFERENCES regional_authorities(id), form_name text NOT NULL, form_version text NOT NULL, url text NOT NULL, field_mappings jsonb NOT NULL, required_fields text[] NOT NULL, optional_fields text[] NOT NULL, attachments jsonb NOT NULL, authentication_requirement text, captcha_restriction text, accessibility_limitations text[], submission_method text NOT NULL, receipt_handling text, last_verified timestamptz, status text NOT NULL DEFAULT 'research_only', CHECK(status IN ('research_only','draft','sandbox','verified','disabled','retired')));

CREATE TABLE regional_publication_workflows (id uuid PRIMARY KEY, region_id text NOT NULL REFERENCES regions(id), dataset_revision_id uuid NOT NULL REFERENCES regional_dataset_revisions(id), current_stage smallint NOT NULL DEFAULT 1, status text NOT NULL DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now(), CHECK(current_stage BETWEEN 1 AND 15));
CREATE TABLE regional_publication_stage_records (workflow_id uuid NOT NULL REFERENCES regional_publication_workflows(id) ON DELETE CASCADE, stage smallint NOT NULL, owner text NOT NULL, decided_at timestamptz, evidence text, decision text, comments text, blocking_issues jsonb NOT NULL DEFAULT '[]'::jsonb, PRIMARY KEY(workflow_id,stage), CHECK(stage BETWEEN 1 AND 15));
CREATE TABLE aggregate_report_runs (id uuid PRIMARY KEY, report_type text NOT NULL, region_id text NOT NULL REFERENCES regions(id), period_start date NOT NULL, period_end date NOT NULL, dataset_revision_id uuid NOT NULL REFERENCES regional_dataset_revisions(id), minimum_cell integer NOT NULL DEFAULT 5, limitations text NOT NULL, aggregate_payload jsonb NOT NULL, created_by uuid REFERENCES users(id), created_at timestamptz NOT NULL DEFAULT now(), CHECK(minimum_cell >= 5));
CREATE TABLE operational_cost_assumptions (id uuid PRIMARY KEY, scenario text NOT NULL, category text NOT NULL, value numeric(14,2) NOT NULL, currency char(3) NOT NULL, assumption_date date NOT NULL, source text NOT NULL, confidence text NOT NULL, notes text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());

INSERT INTO regions(id,name,geography_type,country,nation,legal_jurisdiction,public_status) VALUES
  ('kent-medway','Kent and Medway','region','United Kingdom','England','England and Wales','published'),
  ('sussex','Sussex preparation area','region','United Kingdom','England','England and Wales','blocked'),
  ('east-sussex','East Sussex','county','United Kingdom','England','England and Wales','blocked'),
  ('west-sussex','West Sussex','county','United Kingdom','England','England and Wales','blocked'),
  ('brighton-hove','Brighton and Hove','unitary_authority','United Kingdom','England','England and Wales','blocked');
UPDATE regions SET parent_id='sussex' WHERE id IN ('east-sussex','west-sussex','brighton-hove');
INSERT INTO regional_dataset_revisions(id,region_id,revision,source_dataset_revision_id,state,manifest,published_at)
SELECT '60000000-0000-4000-8000-000000000001','kent-medway','v1.0.1',id,'published','{"compatibility":"existing-kent-identifiers-retained"}'::jsonb,published_at FROM dataset_revisions WHERE external_version='v1.0.1';
INSERT INTO regional_publication_states(region_id,dataset_revision_id,stage,blocked,blocking_issues)
SELECT 'kent-medway',id,'publication',false,'[]'::jsonb FROM regional_dataset_revisions WHERE id='60000000-0000-4000-8000-000000000001';
INSERT INTO regional_publication_states(region_id,dataset_revision_id,stage,blocked,blocking_issues) VALUES
  ('sussex',NULL,'draft_import',true,'["SUSSEX-DATA-001"]');
CREATE FUNCTION phase6_link_kent_revision() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.external_version = 'v1.0.1' THEN
    INSERT INTO regional_dataset_revisions(id,region_id,revision,source_dataset_revision_id,state,manifest,published_at)
    VALUES('60000000-0000-4000-8000-000000000001','kent-medway','v1.0.1',NEW.id,'published','{"compatibility":"existing-kent-identifiers-retained"}'::jsonb,NEW.published_at)
    ON CONFLICT(region_id,revision) DO UPDATE SET source_dataset_revision_id=EXCLUDED.source_dataset_revision_id,published_at=EXCLUDED.published_at;
    INSERT INTO regional_publication_states(region_id,dataset_revision_id,stage,blocked,blocking_issues)
    VALUES('kent-medway','60000000-0000-4000-8000-000000000001','publication',false,'[]'::jsonb)
    ON CONFLICT(region_id) DO UPDATE SET dataset_revision_id=EXCLUDED.dataset_revision_id,stage='publication',blocked=false,blocking_issues='[]'::jsonb;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER phase6_dataset_revision_link AFTER INSERT OR UPDATE OF published_at ON dataset_revisions FOR EACH ROW EXECUTE FUNCTION phase6_link_kent_revision();
INSERT INTO region_identifier_prefixes(region_id,entity_type,prefix) VALUES
  ('east-sussex','service','srv_esx'),('east-sussex','council','council_esx'),('east-sussex','route','route_esx'),
  ('west-sussex','service','srv_wsx'),('west-sussex','council','council_wsx'),('west-sussex','route','route_wsx'),
  ('brighton-hove','service','srv_bnh'),('brighton-hove','council','council_bnh'),('brighton-hove','route','route_bnh');
INSERT INTO phase6_feature_flags(id,description,environment,owner,approval_requirement,risk_level) VALUES
  ('sussex_routing','Enable Sussex public routing','all','regional governance','SUSSEX-DATA-001 and REGION-001','critical'),
  ('provider_self_service_publication','Allow provider direct publication','all','data governance','PROVIDER-001','critical'),
  ('commissioner_live_reports','Enable live commissioner reporting','all','reporting governance','REPORTING-001','high'),
  ('pwa_installation','Offer PWA installation','all','product governance','PWA-001','high'),
  ('push_notifications','Send push notifications','all','privacy governance','PWA-001','high'),
  ('council_direct_submission','Submit directly to councils','all','legal governance','ADAPTER-001','critical'),
  ('live_translation','Publish live translations','all','content governance','TRANSLATION-001','critical'),
  ('bsl_streaming','Stream BSL media','all','accessibility governance','TRANSLATION-001','high'),
  ('partner_analytics','Expose partner analytics','all','privacy governance','REPORTING-001','high'),
  ('multi_region_case_transfer','Transfer cases between regions','all','casework governance','PHASE6-INTEGRATION-001','critical');

COMMIT;
