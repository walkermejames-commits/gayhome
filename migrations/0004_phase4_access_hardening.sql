BEGIN;

-- Phase 3 records each invitation and consent independently. Keeping the original
-- uniqueness constraint made a second invitation for the same case/helper fail,
-- preventing renewal and permission-history preservation. Distinct grants remain
-- individually revocable through their consent and invitation records.
ALTER TABLE case_access_grants
  DROP CONSTRAINT case_access_grants_case_id_grantee_user_id_key;

CREATE INDEX case_grants_subject_history_idx
  ON case_access_grants(case_id, grantee_user_id, created_at DESC);

COMMIT;
