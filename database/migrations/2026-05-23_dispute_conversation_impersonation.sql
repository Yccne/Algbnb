ALTER TABLE litige
  ADD COLUMN IF NOT EXISTS id_conversation BIGINT REFERENCES conversation(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_litige_conversation ON litige(id_conversation);
CREATE INDEX IF NOT EXISTS idx_litige_reservation_ouverture ON litige(id_reservation, id_ouverture, statut);
