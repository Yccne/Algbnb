CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gist;

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

UPDATE disponibilite
SET source_blocage = 'manuel',
    note_interne = COALESCE(NULLIF(note_interne, ''), 'Blocage hote')
WHERE source_blocage = 'maintenance';

ALTER TABLE disponibilite
  ADD CONSTRAINT ck_disponibilite_source
  CHECK (source_blocage IN ('manuel', 'reservation', 'echange'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_reservation_statut'
  ) THEN
    ALTER TABLE reservation DROP CONSTRAINT ck_reservation_statut;
  END IF;
END $$;

ALTER TABLE reservation
  ADD CONSTRAINT ck_reservation_statut
  CHECK (statut IN ('en_attente', 'confirmee', 'refusee', 'annulee_voyageur', 'annulee_hote', 'annulee_admin', 'terminee'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_echange_statut'
  ) THEN
    ALTER TABLE echange_logement DROP CONSTRAINT ck_echange_statut;
  END IF;
END $$;

ALTER TABLE echange_logement
  ADD CONSTRAINT ck_echange_statut
  CHECK (statut IN ('discussion', 'proposee', 'contre_proposee', 'contrepartie_proposee', 'acceptee', 'refusee', 'annulee'));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ex_reservation_no_overlap'
  ) THEN
    ALTER TABLE reservation
      ADD CONSTRAINT ex_reservation_no_overlap
      EXCLUDE USING gist (
        id_logement WITH =,
        daterange(date_arrivee, date_depart, '[)') WITH &&
      )
      WHERE (statut IN ('en_attente', 'confirmee', 'terminee'));
  END IF;
END $$;
