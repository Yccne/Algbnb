DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_disponibilite_source'
  ) THEN
    ALTER TABLE disponibilite DROP CONSTRAINT ck_disponibilite_source;
  END IF;
END $$;

ALTER TABLE disponibilite
  ADD CONSTRAINT ck_disponibilite_source
  CHECK (source_blocage IN ('manuel', 'reservation', 'echange'));

CREATE TABLE IF NOT EXISTS logement_echange_preference (
  id_logement BIGINT PRIMARY KEY REFERENCES logement(id) ON DELETE CASCADE,
  est_ouvert BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT,
  date_mise_a_jour TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS echange_logement (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_logement_demandeur BIGINT NOT NULL REFERENCES logement(id) ON DELETE RESTRICT,
  id_logement_receveur BIGINT NOT NULL REFERENCES logement(id) ON DELETE RESTRICT,
  id_hote_demandeur BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE RESTRICT,
  id_hote_receveur BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE RESTRICT,
  id_conversation BIGINT REFERENCES conversation(id) ON DELETE SET NULL,
  demandeur_date_debut DATE,
  demandeur_date_fin DATE,
  receveur_date_debut DATE,
  receveur_date_fin DATE,
  statut VARCHAR(40) NOT NULL DEFAULT 'discussion',
  motif_refus TEXT,
  dernier_acteur_id BIGINT REFERENCES utilisateur(id) ON DELETE SET NULL,
  date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_mise_a_jour TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  date_decision TIMESTAMP,
  CONSTRAINT ck_echange_logements_distincts CHECK (id_logement_demandeur <> id_logement_receveur),
  CONSTRAINT ck_echange_hotes_distincts CHECK (id_hote_demandeur <> id_hote_receveur),
  CONSTRAINT ck_echange_statut CHECK (statut IN ('discussion', 'proposee', 'contre_proposee', 'contrepartie_proposee', 'acceptee', 'refusee', 'annulee')),
  CONSTRAINT ck_echange_dates_demandeur CHECK (
    demandeur_date_debut IS NULL
    OR demandeur_date_fin IS NULL
    OR demandeur_date_fin > demandeur_date_debut
  ),
  CONSTRAINT ck_echange_dates_receveur CHECK (
    receveur_date_debut IS NULL
    OR receveur_date_fin IS NULL
    OR receveur_date_fin > receveur_date_debut
  )
);

CREATE INDEX IF NOT EXISTS idx_logement_echange_preference_open
  ON logement_echange_preference(est_ouvert, date_mise_a_jour DESC);

CREATE INDEX IF NOT EXISTS idx_echange_logement_demandeur
  ON echange_logement(id_hote_demandeur, statut, date_mise_a_jour DESC);

CREATE INDEX IF NOT EXISTS idx_echange_logement_receveur
  ON echange_logement(id_hote_receveur, statut, date_mise_a_jour DESC);

CREATE INDEX IF NOT EXISTS idx_echange_logement_conversation
  ON echange_logement(id_conversation);
