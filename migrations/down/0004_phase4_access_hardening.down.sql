BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM case_access_grants
    GROUP BY case_id, grantee_user_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Cannot restore the Phase 3 grant uniqueness constraint while permission history contains multiple grants';
  END IF;
END $$;

DROP INDEX IF EXISTS case_grants_subject_history_idx;
ALTER TABLE case_access_grants
  ADD CONSTRAINT case_access_grants_case_id_grantee_user_id_key
  UNIQUE(case_id, grantee_user_id);

COMMIT;
