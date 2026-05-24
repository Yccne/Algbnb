ALTER TABLE logement
  ADD COLUMN IF NOT EXISTS compte_ccp VARCHAR(20);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_logement_compte_ccp'
  ) THEN
    ALTER TABLE logement
      ADD CONSTRAINT ck_logement_compte_ccp
      CHECK (compte_ccp IS NULL OR compte_ccp ~ '^[0-9]{10,20}$');
  END IF;
END $$;
