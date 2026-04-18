-- ==============================================================================
-- 1. UTILISATEUR & RÔLES
-- ==============================================================================

CREATE TABLE utilisateur (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    photo_profil TEXT,
    role_type VARCHAR(50) NOT NULL,
    est_verifie BOOLEAN NOT NULL DEFAULT FALSE,
    date_inscription TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_utilisateur PRIMARY KEY (id),
    CONSTRAINT uq_utilisateur_email UNIQUE (email),
    CONSTRAINT ck_utilisateur_email_format CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')
);

CREATE TABLE hote (
    id_utilisateur BIGINT,
    note_moyenne NUMERIC(3,2) DEFAULT 0,

    CONSTRAINT pk_hote PRIMARY KEY (id_utilisateur),
    CONSTRAINT fk_hote_utilisateur FOREIGN KEY (id_utilisateur) 
        REFERENCES utilisateur(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_hote_note_range CHECK (note_moyenne >= 0 AND note_moyenne <= 5)
);

CREATE TABLE voyageur (
    id_utilisateur BIGINT,

    CONSTRAINT pk_voyageur PRIMARY KEY (id_utilisateur),
    CONSTRAINT fk_voyageur_utilisateur FOREIGN KEY (id_utilisateur) 
        REFERENCES utilisateur(id) ON DELETE CASCADE ON UPDATE CASCADE
);


-- ==============================================================================
-- 2. LOGEMENTS & DÉTAILS
-- ==============================================================================

CREATE TABLE logement (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_hote BIGINT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    type_logement VARCHAR(100) NOT NULL,
    adresse TEXT NOT NULL,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    nb_chambres INT NOT NULL,
    nb_lits INT NOT NULL,
    nb_salles_de_bain INT NOT NULL,
    capacite_accueil INT NOT NULL,
    prix_par_nuit NUMERIC(10, 2) NOT NULL,
    est_actif BOOLEAN NOT NULL DEFAULT TRUE,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_logement PRIMARY KEY (id),
    CONSTRAINT fk_logement_hote FOREIGN KEY (id_hote) 
        REFERENCES hote(id_utilisateur) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_logement_chambres_positif CHECK (nb_chambres >= 0),
    CONSTRAINT ck_logement_lits_positif CHECK (nb_lits >= 0),
    CONSTRAINT ck_logement_sdb_positif CHECK (nb_salles_de_bain >= 0),
    CONSTRAINT ck_logement_capacite_positive CHECK (capacite_accueil > 0),
    CONSTRAINT ck_logement_prix_positif CHECK (prix_par_nuit >= 0)
);

CREATE TABLE logement_photo (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_logement BIGINT NOT NULL,
    url_photo TEXT NOT NULL,

    CONSTRAINT pk_logement_photo PRIMARY KEY (id),
    CONSTRAINT fk_photo_logement FOREIGN KEY (id_logement) 
        REFERENCES logement(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE logement_equipement (
    id_logement BIGINT NOT NULL,
    nom_equipement VARCHAR(100) NOT NULL,

    CONSTRAINT pk_logement_equipement PRIMARY KEY (id_logement, nom_equipement),
    CONSTRAINT fk_equipement_logement FOREIGN KEY (id_logement) 
        REFERENCES logement(id) ON DELETE CASCADE ON UPDATE CASCADE
);


-- ==============================================================================
-- 3. FAVORIS & DISPONIBILITÉS
-- ==============================================================================

CREATE TABLE voyageur_favori (
    id_voyageur BIGINT NOT NULL,
    id_logement BIGINT NOT NULL,
    date_ajout TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_voyageur_favori PRIMARY KEY (id_voyageur, id_logement),
    CONSTRAINT fk_favori_voyageur FOREIGN KEY (id_voyageur) 
        REFERENCES voyageur(id_utilisateur) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_favori_logement FOREIGN KEY (id_logement) 
        REFERENCES logement(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE disponibilite (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_logement BIGINT NOT NULL,
    date_debut DATE NOT NULL,
    date_fin DATE NOT NULL,
    est_bloque BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_disponibilite PRIMARY KEY (id),
    CONSTRAINT fk_disponibilite_logement FOREIGN KEY (id_logement) 
        REFERENCES logement(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT ck_disponibilite_dates CHECK (date_fin >= date_debut)
);


-- ==============================================================================
-- 4. RÉSERVATIONS & PAIEMENTS
-- ==============================================================================

CREATE TABLE reservation (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_voyageur BIGINT NOT NULL,
    id_logement BIGINT NOT NULL,
    date_arrivee DATE NOT NULL,
    date_depart DATE NOT NULL,
    nb_voyageurs INT NOT NULL,
    montant_total NUMERIC(10, 2) NOT NULL,
    statut VARCHAR(50) NOT NULL,
    politique_annulation TEXT,
    date_reservation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_reservation PRIMARY KEY (id),
    CONSTRAINT fk_reservation_voyageur FOREIGN KEY (id_voyageur) 
        REFERENCES voyageur(id_utilisateur) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_reservation_logement FOREIGN KEY (id_logement) 
        REFERENCES logement(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_reservation_dates CHECK (date_depart > date_arrivee),
    CONSTRAINT ck_reservation_voyageurs_positif CHECK (nb_voyageurs > 0),
    CONSTRAINT ck_reservation_montant_positif CHECK (montant_total >= 0)
);

CREATE TABLE paiement (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_reservation BIGINT NOT NULL,
    montant NUMERIC(10, 2) NOT NULL,
    devise VARCHAR(10) NOT NULL DEFAULT 'EUR',
    statut VARCHAR(50) NOT NULL,
    methode_paiement VARCHAR(100),
    date_paiement TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_paiement PRIMARY KEY (id),
    CONSTRAINT uq_paiement_reservation UNIQUE (id_reservation),
    CONSTRAINT fk_paiement_reservation FOREIGN KEY (id_reservation) 
        REFERENCES reservation(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT ck_paiement_montant_positif CHECK (montant >= 0)
);


-- ==============================================================================
-- 5. AVIS, NOTIFICATIONS & RAPPORTS
-- ==============================================================================

CREATE TABLE avis (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_voyageur BIGINT,
    id_logement BIGINT NOT NULL,
    id_reservation BIGINT,
    note_logement INT NOT NULL,
    note_hote INT NOT NULL,
    commentaire TEXT,
    date_avis TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    est_visible BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT pk_avis PRIMARY KEY (id),
    CONSTRAINT fk_avis_voyageur FOREIGN KEY (id_voyageur) 
        REFERENCES voyageur(id_utilisateur) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_avis_logement FOREIGN KEY (id_logement) 
        REFERENCES logement(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_avis_reservation FOREIGN KEY (id_reservation) 
        REFERENCES reservation(id) ON DELETE SET NULL,
    CONSTRAINT ck_avis_note_logement CHECK (note_logement BETWEEN 1 AND 5),
    CONSTRAINT ck_avis_note_hote CHECK (note_hote BETWEEN 1 AND 5)
);

CREATE TABLE notification (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_utilisateur BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    contenu TEXT NOT NULL,
    est_lue BOOLEAN NOT NULL DEFAULT FALSE,
    date_envoi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_notification PRIMARY KEY (id),
    CONSTRAINT fk_notification_utilisateur FOREIGN KEY (id_utilisateur) 
        REFERENCES utilisateur(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE rapport (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_hote BIGINT,
    type VARCHAR(100) NOT NULL,
    date_generation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revenu_total NUMERIC(12, 2) NOT NULL DEFAULT 0.0,
    nb_reservations INT NOT NULL DEFAULT 0,
    taux_annulation NUMERIC(5, 2) NOT NULL DEFAULT 0.0,

    CONSTRAINT pk_rapport PRIMARY KEY (id),
    CONSTRAINT fk_rapport_hote FOREIGN KEY (id_hote) 
        REFERENCES hote(id_utilisateur) ON DELETE CASCADE,
    CONSTRAINT ck_rapport_taux_range CHECK (taux_annulation BETWEEN 0 AND 100)
);


-- ==============================================================================
-- 6. CONVERSATIONS & MESSAGERIE
-- ==============================================================================

CREATE TABLE conversation (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_utilisateur1 BIGINT NOT NULL,
    id_utilisateur2 BIGINT NOT NULL,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_conversation PRIMARY KEY (id),
    CONSTRAINT uq_conversation_duo UNIQUE (id_utilisateur1, id_utilisateur2),
    CONSTRAINT fk_conv_user1 FOREIGN KEY (id_utilisateur1) REFERENCES utilisateur(id) ON DELETE CASCADE,
    CONSTRAINT fk_conv_user2 FOREIGN KEY (id_utilisateur2) REFERENCES utilisateur(id) ON DELETE CASCADE
);

CREATE TABLE message (
    id BIGINT GENERATED ALWAYS AS IDENTITY,
    id_conversation BIGINT NOT NULL,
    id_expediteur BIGINT NOT NULL,
    contenu TEXT NOT NULL,
    date_envoi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    est_lu BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_message PRIMARY KEY (id),
    CONSTRAINT fk_message_conversation FOREIGN KEY (id_conversation) 
        REFERENCES conversation(id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_message_expediteur FOREIGN KEY (id_expediteur) 
        REFERENCES utilisateur(id) ON DELETE CASCADE
);