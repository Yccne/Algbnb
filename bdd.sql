CREATE EXTENSION IF NOT EXISTS pg_trgm;

DROP TABLE IF EXISTS litige CASCADE;
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS avis CASCADE;
DROP TABLE IF EXISTS paiement CASCADE;
DROP TABLE IF EXISTS reservation CASCADE;
DROP TABLE IF EXISTS rapport CASCADE;
DROP TABLE IF EXISTS voyageur_favori CASCADE;
DROP TABLE IF EXISTS disponibilite CASCADE;
DROP TABLE IF EXISTS logement_equipement CASCADE;
DROP TABLE IF EXISTS logement_photo CASCADE;
DROP TABLE IF EXISTS message CASCADE;
DROP TABLE IF EXISTS conversation CASCADE;
DROP TABLE IF EXISTS password_reset_token CASCADE;
DROP TABLE IF EXISTS logement CASCADE;
DROP TABLE IF EXISTS hote CASCADE;
DROP TABLE IF EXISTS voyageur CASCADE;
DROP TABLE IF EXISTS utilisateur CASCADE;

CREATE TABLE utilisateur (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telephone VARCHAR(30) UNIQUE,
    mot_de_passe VARCHAR(255),
    photo_profil TEXT,
    bio TEXT,
    role_type VARCHAR(30) NOT NULL DEFAULT 'voyageur',
    provider_source VARCHAR(30) NOT NULL DEFAULT 'local',
    provider_id VARCHAR(255),
    est_verifie BOOLEAN NOT NULL DEFAULT FALSE,
    verification_niveau SMALLINT NOT NULL DEFAULT 0,
    statut_compte VARCHAR(30) NOT NULL DEFAULT 'actif',
    derniere_connexion TIMESTAMP,
    date_inscription TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_mise_a_jour TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_utilisateur_role CHECK (role_type IN ('voyageur', 'hote', 'admin')),
    CONSTRAINT ck_utilisateur_provider CHECK (provider_source IN ('local', 'google', 'facebook')),
    CONSTRAINT ck_utilisateur_statut CHECK (statut_compte IN ('actif', 'suspendu', 'bloque')),
    CONSTRAINT ck_utilisateur_contact CHECK (email IS NOT NULL OR telephone IS NOT NULL)
);

CREATE INDEX idx_utilisateur_role ON utilisateur(role_type);
CREATE INDEX idx_utilisateur_email ON utilisateur(email);
CREATE INDEX idx_utilisateur_telephone ON utilisateur(telephone);

CREATE TABLE password_reset_token (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_utilisateur BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_reset_utilisateur ON password_reset_token(id_utilisateur);
CREATE INDEX idx_password_reset_expiration ON password_reset_token(expires_at);

CREATE TABLE logement (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_hote BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type_logement VARCHAR(100) NOT NULL,
    adresse TEXT NOT NULL,
    ville VARCHAR(120) NOT NULL,
    pays VARCHAR(120) NOT NULL DEFAULT 'Algérie',
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    nb_chambres INT NOT NULL DEFAULT 0,
    nb_lits INT NOT NULL DEFAULT 1,
    nb_salles_de_bain INT NOT NULL DEFAULT 1,
    capacite_accueil INT NOT NULL DEFAULT 1,
    prix_par_nuit NUMERIC(12, 2) NOT NULL,
    frais_service_pct NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    mode_reservation VARCHAR(30) NOT NULL DEFAULT 'sur_approbation',
    politique_annulation VARCHAR(30) NOT NULL DEFAULT 'moderee',
    regles_maison TEXT,
    validation_statut VARCHAR(30) NOT NULL DEFAULT 'en_attente',
    est_actif BOOLEAN NOT NULL DEFAULT FALSE,
    est_supprime BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_mise_a_jour TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_logement_mode CHECK (mode_reservation IN ('instantanee', 'sur_approbation')),
    CONSTRAINT ck_logement_politique CHECK (politique_annulation IN ('souple', 'moderee', 'stricte')),
    CONSTRAINT ck_logement_validation CHECK (validation_statut IN ('en_attente', 'valide', 'refuse')),
    CONSTRAINT ck_logement_capacite CHECK (capacite_accueil > 0),
    CONSTRAINT ck_logement_prix CHECK (prix_par_nuit >= 0),
    CONSTRAINT ck_logement_frais CHECK (frais_service_pct >= 0 AND frais_service_pct <= 100),
    CONSTRAINT ck_logement_chambres CHECK (nb_chambres >= 0),
    CONSTRAINT ck_logement_lits CHECK (nb_lits >= 0),
    CONSTRAINT ck_logement_sdb CHECK (nb_salles_de_bain >= 0)
);

CREATE INDEX idx_logement_hote ON logement(id_hote);
CREATE INDEX idx_logement_ville ON logement(ville);
CREATE INDEX idx_logement_actif ON logement(est_actif, validation_statut);
CREATE INDEX idx_logement_search_tsv ON logement USING GIN (
    (
        setweight(to_tsvector('simple', COALESCE(titre, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(ville, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(adresse, '')), 'B') ||
        setweight(to_tsvector('simple', COALESCE(description, '')), 'C')
    )
);
CREATE INDEX idx_logement_titre_trgm ON logement USING GIN (titre gin_trgm_ops);
CREATE INDEX idx_logement_ville_trgm ON logement USING GIN (ville gin_trgm_ops);
CREATE INDEX idx_logement_adresse_trgm ON logement USING GIN (adresse gin_trgm_ops);

CREATE TABLE logement_photo (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_logement BIGINT NOT NULL REFERENCES logement(id) ON DELETE CASCADE,
    url_photo TEXT NOT NULL,
    ordre_affichage INT NOT NULL DEFAULT 0,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logement_equipement (
    id_logement BIGINT NOT NULL REFERENCES logement(id) ON DELETE CASCADE,
    nom_equipement VARCHAR(100) NOT NULL,
    PRIMARY KEY (id_logement, nom_equipement)
);

CREATE TABLE disponibilite (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_logement BIGINT NOT NULL REFERENCES logement(id) ON DELETE CASCADE,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    est_bloque BOOLEAN NOT NULL DEFAULT FALSE,
    source_blocage VARCHAR(30) NOT NULL DEFAULT 'manuel',
    note_interne TEXT,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_disponibilite_dates CHECK (date_fin >= date_debut),
    CONSTRAINT ck_disponibilite_source CHECK (source_blocage IN ('manuel', 'reservation', 'maintenance'))
);

CREATE INDEX idx_disponibilite_logement ON disponibilite(id_logement, date_debut, date_fin);

CREATE TABLE voyageur_favori (
    id_voyageur BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    id_logement BIGINT NOT NULL REFERENCES logement(id) ON DELETE CASCADE,
    date_ajout TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_voyageur, id_logement)
);

CREATE TABLE reservation (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_voyageur BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE RESTRICT,
    id_logement BIGINT NOT NULL REFERENCES logement(id) ON DELETE RESTRICT,
    date_arrivee DATE NOT NULL,
    date_depart DATE NOT NULL,
    nb_voyageurs INT NOT NULL,
    prix_par_nuit NUMERIC(12, 2) NOT NULL,
    sous_total NUMERIC(12, 2) NOT NULL,
    frais_service NUMERIC(12, 2) NOT NULL DEFAULT 0,
    montant_total NUMERIC(12, 2) NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'en_attente',
    politique_annulation VARCHAR(30) NOT NULL DEFAULT 'moderee',
    mode_confirmation VARCHAR(30) NOT NULL DEFAULT 'sur_approbation',
    date_reservation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_annulation TIMESTAMP,
    motif_annulation TEXT,
    CONSTRAINT ck_reservation_dates CHECK (date_depart > date_arrivee),
    CONSTRAINT ck_reservation_voyageurs CHECK (nb_voyageurs > 0),
    CONSTRAINT ck_reservation_total CHECK (montant_total >= 0),
    CONSTRAINT ck_reservation_statut CHECK (statut IN ('en_attente', 'confirmee', 'refusee', 'annulee_voyageur', 'annulee_hote', 'terminee')),
    CONSTRAINT ck_reservation_politique CHECK (politique_annulation IN ('souple', 'moderee', 'stricte')),
    CONSTRAINT ck_reservation_mode CHECK (mode_confirmation IN ('instantanee', 'sur_approbation'))
);

CREATE INDEX idx_reservation_logement_dates ON reservation(id_logement, date_arrivee, date_depart);
CREATE INDEX idx_reservation_voyageur ON reservation(id_voyageur, date_reservation DESC);

CREATE TABLE paiement (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_reservation BIGINT NOT NULL UNIQUE REFERENCES reservation(id) ON DELETE CASCADE,
    montant NUMERIC(12, 2) NOT NULL,
    devise VARCHAR(10) NOT NULL DEFAULT 'DZD',
    statut VARCHAR(30) NOT NULL DEFAULT 'en_attente',
    methode_paiement VARCHAR(100) NOT NULL DEFAULT 'validation_locale',
    reference_transaction VARCHAR(255),
    date_paiement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_paiement_statut CHECK (statut IN ('en_attente', 'paye', 'echoue', 'rembourse')),
    CONSTRAINT ck_paiement_montant CHECK (montant >= 0)
);

CREATE TABLE conversation (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_utilisateur1 BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    id_utilisateur2 BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_mise_a_jour TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_conversation_distincts CHECK (id_utilisateur1 <> id_utilisateur2),
    CONSTRAINT uq_conversation_duo UNIQUE (id_utilisateur1, id_utilisateur2)
);

CREATE TABLE message (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_conversation BIGINT NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
    id_expediteur BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    contenu TEXT,
    photo_url TEXT,
    date_envoi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    est_lu BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT ck_message_payload CHECK (contenu IS NOT NULL OR photo_url IS NOT NULL)
);

CREATE INDEX idx_message_conversation ON message(id_conversation, date_envoi);

CREATE TABLE avis (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_voyageur BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    id_hote BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    id_logement BIGINT NOT NULL REFERENCES logement(id) ON DELETE CASCADE,
    id_reservation BIGINT UNIQUE REFERENCES reservation(id) ON DELETE SET NULL,
    note_logement INT NOT NULL,
    note_hote INT NOT NULL,
    commentaire TEXT,
    est_visible BOOLEAN NOT NULL DEFAULT TRUE,
    date_avis TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ck_avis_note_logement CHECK (note_logement BETWEEN 1 AND 5),
    CONSTRAINT ck_avis_note_hote CHECK (note_hote BETWEEN 1 AND 5)
);

CREATE INDEX idx_avis_logement ON avis(id_logement, date_avis DESC);

CREATE TABLE notification (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_utilisateur BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    contenu TEXT NOT NULL,
    meta JSONB,
    est_lue BOOLEAN NOT NULL DEFAULT FALSE,
    date_envoi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_user ON notification(id_utilisateur, est_lue, date_envoi DESC);

CREATE TABLE litige (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_reservation BIGINT REFERENCES reservation(id) ON DELETE SET NULL,
    id_ouverture BIGINT NOT NULL REFERENCES utilisateur(id) ON DELETE CASCADE,
    sujet VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'ouvert',
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_resolution TIMESTAMP,
    CONSTRAINT ck_litige_statut CHECK (statut IN ('ouvert', 'en_cours', 'resolu', 'ferme'))
);
