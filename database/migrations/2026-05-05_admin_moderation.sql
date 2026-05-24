CREATE TABLE IF NOT EXISTS admin_action (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_admin BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL,
  action VARCHAR(80) NOT NULL,
  cible_type VARCHAR(40) NOT NULL,
  cible_id BIGINT,
  ancienne_valeur JSONB,
  nouvelle_valeur JSONB,
  note TEXT,
  date_action TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_action_admin ON admin_action(id_admin, date_action DESC);
CREATE INDEX IF NOT EXISTS idx_admin_action_target ON admin_action(cible_type, cible_id, date_action DESC);

ALTER TABLE message
  ADD COLUMN IF NOT EXISTS est_visible BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS moderation_note TEXT,
  ADD COLUMN IF NOT EXISTS id_moderateur BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS date_moderation TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_message_visible ON message(id_conversation, est_visible, date_envoi);

ALTER TABLE litige
  ADD COLUMN IF NOT EXISTS id_assigne BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS priorite VARCHAR(20) NOT NULL DEFAULT 'normale',
  ADD COLUMN IF NOT EXISTS resolution_note TEXT,
  ADD COLUMN IF NOT EXISTS date_mise_a_jour TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_litige_priorite'
  ) THEN
    ALTER TABLE litige
      ADD CONSTRAINT ck_litige_priorite
      CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente'));
  END IF;
END $$;
