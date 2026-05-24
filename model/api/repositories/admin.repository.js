const database = require('./database.repository');

const addParam = (params, value) => {
  params.push(value);
  return `$${params.length}`;
};

const like = (value) => `%${String(value).trim().toLowerCase()}%`;
const numericSearch = (value) => {
  const normalized = String(value || '').trim();
  return /^\d+$/.test(normalized) ? Number(normalized) : null;
};

const addSearchClause = ({ filters, params, where, textSql, idColumns = [] }) => {
  if (!filters.search) return;
  const numeric = numericSearch(filters.search);
  const clauses = [textSql.replaceAll('__PARAM__', addParam(params, like(filters.search)))];
  if (numeric !== null) {
    const idParam = addParam(params, numeric);
    clauses.push(...idColumns.map((column) => `${column} = ${idParam}`));
  }
  where.push(`(${clauses.join(' OR ')})`);
};

const limitClause = (params, filters = {}) => {
  const limit = Math.min(Number(filters.limit) || 100, 250);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  return `LIMIT ${addParam(params, limit)} OFFSET ${addParam(params, offset)}`;
};

const getStats = async () => {
  const result = await database.query(`
    SELECT
      (SELECT COUNT(*) FROM utilisateur) AS nb_utilisateurs,
      (SELECT COUNT(*) FROM utilisateur WHERE role_type = 'hote') AS nb_hotes,
      (SELECT COUNT(*) FROM utilisateur WHERE role_type = 'voyageur') AS nb_voyageurs,
      (SELECT COUNT(*) FROM utilisateur WHERE statut_compte <> 'actif') AS nb_comptes_surveilles,
      (SELECT COUNT(*) FROM logement WHERE est_supprime = FALSE) AS nb_annonces,
      (SELECT COUNT(*) FROM logement WHERE validation_statut = 'en_attente' AND est_supprime = FALSE) AS nb_annonces_en_attente,
      (SELECT COUNT(*) FROM reservation) AS nb_reservations,
      (SELECT COUNT(*) FROM reservation WHERE statut = 'en_attente') AS nb_reservations_en_attente,
      (SELECT COUNT(*) FROM paiement WHERE statut = 'paye') AS nb_paiements_payes,
      (SELECT COUNT(*) FROM message WHERE est_visible = FALSE) AS nb_messages_masques,
      (SELECT COUNT(*) FROM avis WHERE est_visible = FALSE) AS nb_avis_masques,
      (SELECT COUNT(*) FROM litige WHERE statut IN ('ouvert', 'en_cours')) AS nb_litiges_ouverts,
      (SELECT COALESCE(SUM(montant_total), 0) FROM reservation WHERE statut IN ('confirmee', 'terminee')) AS revenu_total,
      (
        SELECT COALESCE(
          ROUND(
            COUNT(*) FILTER (WHERE statut IN ('annulee_hote', 'annulee_voyageur', 'annulee_admin')) * 100.0 / NULLIF(COUNT(*), 0),
            2
          ),
          0
        )
        FROM reservation
      ) AS taux_annulation
  `);
  return result.rows[0];
};

const listUsers = async (filters = {}) => {
  const params = [];
  const where = [];

  if (filters.search) {
    addSearchClause({
      filters,
      params,
      where,
      textSql: "LOWER(CONCAT_WS(' ', u.nom, u.prenom, u.email, u.telephone, u.role_type)) LIKE __PARAM__",
      idColumns: ['u.id'],
    });
  }
  if (filters.role) {
    where.push(`u.role_type = ${addParam(params, filters.role)}`);
  }
  if (filters.statut_compte) {
    where.push(`u.statut_compte = ${addParam(params, filters.statut_compte)}`);
  }

  const result = await database.query(
    `
      SELECT
        u.id, u.nom, u.prenom, u.email, u.telephone, u.role_type, u.statut_compte,
        u.est_verifie, u.verification_niveau, u.provider_source, u.derniere_connexion,
        u.date_inscription, u.date_mise_a_jour,
        (SELECT COUNT(*)::int FROM logement l WHERE l.id_hote = u.id AND l.est_supprime = FALSE) AS nb_annonces,
        (SELECT COUNT(*)::int FROM reservation r WHERE r.id_voyageur = u.id) AS nb_reservations_voyageur,
        (
          SELECT COUNT(*)::int
          FROM reservation r
          JOIN logement l ON l.id = r.id_logement
          WHERE l.id_hote = u.id
        ) AS nb_reservations_hote,
        (
          SELECT COUNT(*)::int
          FROM conversation c
          WHERE c.id_utilisateur1 = u.id OR c.id_utilisateur2 = u.id
        ) AS nb_conversations,
        (
          SELECT COUNT(*)::int
          FROM litige li
          WHERE li.id_ouverture = u.id OR li.id_assigne = u.id
        ) AS nb_litiges
      FROM utilisateur u
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY u.date_inscription DESC
      ${limitClause(params, filters)}
    `,
    params
  );
  return result.rows;
};

const updateUserStatus = async ({ userId, status }) =>
  database.withTransaction(async (client) => {
    const before = await client.query('SELECT id, statut_compte FROM utilisateur WHERE id = $1 LIMIT 1', [userId]);
    if (!before.rows[0]) return null;
    const after = await client.query(
      `
        UPDATE utilisateur
        SET statut_compte = $1, date_mise_a_jour = NOW()
        WHERE id = $2
        RETURNING id, statut_compte, date_mise_a_jour
      `,
      [status, userId]
    );
    return { before: before.rows[0], after: after.rows[0] };
  });

const updateUserVerification = async ({ userId, verified }) =>
  database.withTransaction(async (client) => {
    const before = await client.query('SELECT id, est_verifie, verification_niveau FROM utilisateur WHERE id = $1 LIMIT 1', [userId]);
    if (!before.rows[0]) return null;
    const after = await client.query(
      `
        UPDATE utilisateur
        SET est_verifie = $1,
            verification_niveau = CASE WHEN $1 = TRUE THEN GREATEST(verification_niveau, 1) ELSE 0 END,
            date_mise_a_jour = NOW()
        WHERE id = $2
        RETURNING id, est_verifie, verification_niveau, date_mise_a_jour
      `,
      [verified, userId]
    );
    return { before: before.rows[0], after: after.rows[0] };
  });

const findUserForAdmin = async (userId) => {
  const result = await database.query(
    `
      SELECT *
      FROM utilisateur
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );
  return result.rows[0] || null;
};

const listListings = async (filters = {}) => {
  const params = [];
  const where = ['l.est_supprime = FALSE'];

  if (filters.search) {
    addSearchClause({
      filters,
      params,
      where,
      textSql: "LOWER(CONCAT_WS(' ', l.titre, l.ville, l.adresse, u.nom, u.prenom, u.email)) LIKE __PARAM__",
      idColumns: ['l.id', 'l.id_hote'],
    });
  }
  if (filters.validation_statut) {
    where.push(`l.validation_statut = ${addParam(params, filters.validation_statut)}`);
  }
  if (filters.est_actif !== undefined && filters.est_actif !== '') {
    where.push(`l.est_actif = ${addParam(params, filters.est_actif === true || filters.est_actif === 'true')}`);
  }

  const result = await database.query(
    `
      SELECT
        l.id, l.id_hote, l.titre, l.description, l.type_logement, l.adresse, l.ville, l.pays,
        l.latitude, l.longitude, l.capacite_accueil, l.prix_par_nuit, l.mode_reservation,
        l.politique_annulation, l.compte_ccp, l.validation_statut, l.est_actif, l.date_creation,
        u.nom AS hote_nom, u.prenom AS hote_prenom, u.email AS hote_email, u.statut_compte AS hote_statut_compte,
        (SELECT COUNT(*)::int FROM reservation r WHERE r.id_logement = l.id) AS nb_reservations,
        (SELECT COUNT(*)::int FROM avis a WHERE a.id_logement = l.id) AS nb_avis,
        (SELECT COALESCE(ROUND(AVG(a.note_logement)::numeric, 2), 0) FROM avis a WHERE a.id_logement = l.id AND a.est_visible = TRUE) AS note_moyenne,
        COALESCE((SELECT ARRAY_REMOVE(ARRAY_AGG(lp.url_photo ORDER BY lp.ordre_affichage), NULL) FROM logement_photo lp WHERE lp.id_logement = l.id), '{}') AS photos
      FROM logement l
      JOIN utilisateur u ON u.id = l.id_hote
      WHERE ${where.join(' AND ')}
      ORDER BY l.date_creation DESC
      ${limitClause(params, filters)}
    `,
    params
  );
  return result.rows;
};

const updateListingValidation = async ({ listingId, status }) =>
  database.withTransaction(async (client) => {
    const before = await client.query('SELECT id, validation_statut, est_actif FROM logement WHERE id = $1 LIMIT 1', [listingId]);
    if (!before.rows[0]) return null;
    const after = await client.query(
      `
        UPDATE logement
        SET validation_statut = $1,
            est_actif = CASE WHEN $1 = 'valide' THEN est_actif ELSE FALSE END,
            date_mise_a_jour = NOW()
        WHERE id = $2
        RETURNING id, validation_statut, est_actif, date_mise_a_jour
      `,
      [status, listingId]
    );
    return { before: before.rows[0], after: after.rows[0] };
  });

const updateListingPublication = async ({ listingId, active }) =>
  database.withTransaction(async (client) => {
    const before = await client.query('SELECT id, est_actif, validation_statut FROM logement WHERE id = $1 LIMIT 1', [listingId]);
    if (!before.rows[0]) return null;
    const after = await client.query(
      `
        UPDATE logement
        SET est_actif = CASE WHEN validation_statut = 'valide' THEN $1 ELSE FALSE END,
            date_mise_a_jour = NOW()
        WHERE id = $2
        RETURNING id, est_actif, validation_statut, date_mise_a_jour
      `,
      [active, listingId]
    );
    return { before: before.rows[0], after: after.rows[0] };
  });

const listReservations = async (filters = {}) => {
  const params = [];
  const where = [];

  if (filters.search) {
    addSearchClause({
      filters,
      params,
      where,
      textSql: "LOWER(CONCAT_WS(' ', l.titre, l.ville, v.nom, v.prenom, v.email, h.nom, h.prenom, h.email)) LIKE __PARAM__",
      idColumns: ['r.id', 'r.id_voyageur', 'l.id_hote', 'l.id'],
    });
  }
  if (filters.statut) {
    where.push(`r.statut = ${addParam(params, filters.statut)}`);
  }

  const result = await database.query(
    `
      SELECT
        r.*,
        l.titre AS logement_titre, l.ville AS logement_ville, l.compte_ccp, l.id_hote,
        v.nom AS voyageur_nom, v.prenom AS voyageur_prenom, v.email AS voyageur_email,
        h.nom AS hote_nom, h.prenom AS hote_prenom, h.email AS hote_email,
        p.id AS paiement_id, p.statut AS paiement_statut, p.methode_paiement, p.reference_transaction, p.date_paiement,
        a.id AS avis_id,
        (SELECT COUNT(*)::int FROM litige li WHERE li.id_reservation = r.id) AS nb_litiges
      FROM reservation r
      JOIN logement l ON l.id = r.id_logement
      JOIN utilisateur v ON v.id = r.id_voyageur
      JOIN utilisateur h ON h.id = l.id_hote
      LEFT JOIN paiement p ON p.id_reservation = r.id
      LEFT JOIN avis a ON a.id_reservation = r.id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY r.date_reservation DESC
      ${limitClause(params, filters)}
    `,
    params
  );
  return result.rows;
};

const findReservation = async (client, reservationId) => {
  const result = await client.query(
    `
      SELECT r.*, l.id_hote, l.id AS logement_id, l.titre
      FROM reservation r
      JOIN logement l ON l.id = r.id_logement
      WHERE r.id = $1
      LIMIT 1
    `,
    [reservationId]
  );
  return result.rows[0] || null;
};

const activeReservationStatuses = ['en_attente', 'confirmee', 'terminee'];

const createReservationConflictError = (message) => {
  const error = new Error(message);
  error.code = 'RESERVATION_CONFLICT';
  return error;
};

const updateReservationStatus = async ({ reservationId, status, reason }) =>
  database.withTransaction(async (client) => {
    const before = await findReservation(client, reservationId);
    if (!before) return null;

    await client.query('SELECT id FROM logement WHERE id = $1 FOR UPDATE', [before.id_logement]);

    if (status === 'confirmee') {
      const reservationConflict = await client.query(
        `
          SELECT 1
          FROM reservation r
          WHERE r.id_logement = $1
            AND r.id <> $5
            AND r.statut = ANY($2::text[])
            AND NOT (r.date_depart <= $3 OR r.date_arrivee >= $4)
          LIMIT 1
        `,
        [before.id_logement, activeReservationStatuses, before.date_arrivee, before.date_depart, before.id]
      );
      if (reservationConflict.rows.length > 0) {
        throw createReservationConflictError('Ce logement a deja une reservation sur cette periode.');
      }

      const blockConflict = await client.query(
        `
          SELECT 1
          FROM disponibilite d
          WHERE d.id_logement = $1
            AND d.est_bloque = TRUE
            AND NOT (d.date_fin < $2 OR d.date_debut >= $3)
          LIMIT 1
        `,
        [before.id_logement, before.date_arrivee, before.date_depart]
      );
      if (blockConflict.rows.length > 0) {
        throw createReservationConflictError('Ces dates sont bloquees par l hote.');
      }
    }

    const after = await client.query(
      `
        UPDATE reservation
        SET statut = $1::text,
            date_annulation = CASE WHEN $1::text IN ('annulee_hote', 'annulee_voyageur', 'annulee_admin') THEN NOW() ELSE date_annulation END,
            motif_annulation = CASE WHEN $1::text IN ('annulee_hote', 'annulee_voyageur', 'annulee_admin') THEN $2 ELSE motif_annulation END
        WHERE id = $3
        RETURNING *
      `,
      [status, reason || null, reservationId]
    );

    if (status === 'confirmee') {
      await client.query(
        `
          INSERT INTO disponibilite (id_logement, date_debut, date_fin, est_bloque, source_blocage, note_interne)
          VALUES ($1, $2, $3, TRUE, 'reservation', $4)
          ON CONFLICT DO NOTHING
        `,
        [before.id_logement, before.date_arrivee, before.date_depart, `Reservation #${before.id}`]
      );
    }

    if (['refusee', 'annulee_hote', 'annulee_voyageur', 'annulee_admin'].includes(status)) {
      await client.query(
        `
          DELETE FROM disponibilite
          WHERE id_logement = $1
            AND source_blocage = 'reservation'
            AND date_debut = $2
            AND date_fin = $3
        `,
        [before.id_logement, before.date_arrivee, before.date_depart]
      );

      await client.query(
        `
          UPDATE paiement
          SET statut = 'rembourse'
          WHERE id_reservation = $1
            AND statut = 'paye'
        `,
        [before.id]
      );
    }

    return { before, after: after.rows[0] };
  });

const listConversations = async (filters = {}) => {
  const params = [];
  const where = [];

  if (filters.search) {
    addSearchClause({
      filters,
      params,
      where,
      textSql: "LOWER(CONCAT_WS(' ', u1.nom, u1.prenom, u1.email, u2.nom, u2.prenom, u2.email, last_message.contenu)) LIKE __PARAM__",
      idColumns: ['c.id', 'u1.id', 'u2.id'],
    });
  }

  const result = await database.query(
    `
      SELECT
        c.id AS conversation_id, c.date_creation, c.date_mise_a_jour,
        u1.id AS utilisateur1_id, u1.nom AS utilisateur1_nom, u1.prenom AS utilisateur1_prenom, u1.email AS utilisateur1_email, u1.role_type AS utilisateur1_role,
        u2.id AS utilisateur2_id, u2.nom AS utilisateur2_nom, u2.prenom AS utilisateur2_prenom, u2.email AS utilisateur2_email, u2.role_type AS utilisateur2_role,
        last_message.contenu AS dernier_message,
        last_message.photo_url AS derniere_photo,
        last_message.date_envoi AS dernier_message_date,
        (SELECT COUNT(*)::int FROM message m WHERE m.id_conversation = c.id) AS nb_messages,
        (SELECT COUNT(*)::int FROM message m WHERE m.id_conversation = c.id AND m.est_visible = FALSE) AS nb_messages_masques
      FROM conversation c
      JOIN utilisateur u1 ON u1.id = c.id_utilisateur1
      JOIN utilisateur u2 ON u2.id = c.id_utilisateur2
      LEFT JOIN LATERAL (
        SELECT contenu, photo_url, date_envoi
        FROM message
        WHERE id_conversation = c.id
        ORDER BY date_envoi DESC
        LIMIT 1
      ) last_message ON TRUE
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY COALESCE(last_message.date_envoi, c.date_creation) DESC
      ${limitClause(params, filters)}
    `,
    params
  );
  return result.rows;
};

const listConversationMessages = async (conversationId) => {
  const result = await database.query(
    `
      SELECT
        m.*,
        u.nom AS expediteur_nom, u.prenom AS expediteur_prenom, u.email AS expediteur_email,
        mod.nom AS moderateur_nom, mod.prenom AS moderateur_prenom
      FROM message m
      JOIN utilisateur u ON u.id = m.id_expediteur
      LEFT JOIN utilisateur mod ON mod.id = m.id_moderateur
      WHERE m.id_conversation = $1
      ORDER BY m.date_envoi ASC
    `,
    [conversationId]
  );
  return result.rows;
};

const updateMessageVisibility = async ({ messageId, visible, moderatorId, note }) =>
  database.withTransaction(async (client) => {
    const before = await client.query('SELECT id, est_visible, moderation_note FROM message WHERE id = $1 LIMIT 1', [messageId]);
    if (!before.rows[0]) return null;
    const after = await client.query(
      `
        UPDATE message
        SET est_visible = $1,
            moderation_note = $2,
            id_moderateur = $3,
            date_moderation = NOW()
        WHERE id = $4
        RETURNING *
      `,
      [visible, note || null, moderatorId || null, messageId]
    );
    return { before: before.rows[0], after: after.rows[0] };
  });

const listReviews = async (filters = {}) => {
  const params = [];
  const where = [];

  if (filters.search) {
    addSearchClause({
      filters,
      params,
      where,
      textSql: "LOWER(CONCAT_WS(' ', a.commentaire, l.titre, v.nom, v.prenom, h.nom, h.prenom)) LIKE __PARAM__",
      idColumns: ['a.id', 'a.id_voyageur', 'a.id_hote', 'a.id_logement'],
    });
  }
  if (filters.est_visible !== undefined && filters.est_visible !== '') {
    where.push(`a.est_visible = ${addParam(params, filters.est_visible === true || filters.est_visible === 'true')}`);
  }

  const result = await database.query(
    `
      SELECT
        a.*,
        l.titre AS logement_titre, l.ville AS logement_ville,
        v.nom AS voyageur_nom, v.prenom AS voyageur_prenom, v.email AS voyageur_email,
        h.nom AS hote_nom, h.prenom AS hote_prenom, h.email AS hote_email,
        r.statut AS reservation_statut
      FROM avis a
      JOIN logement l ON l.id = a.id_logement
      JOIN utilisateur v ON v.id = a.id_voyageur
      JOIN utilisateur h ON h.id = a.id_hote
      LEFT JOIN reservation r ON r.id = a.id_reservation
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY a.date_avis DESC
      ${limitClause(params, filters)}
    `,
    params
  );
  return result.rows;
};

const updateReviewVisibility = async ({ reviewId, visible }) =>
  database.withTransaction(async (client) => {
    const before = await client.query('SELECT id, est_visible FROM avis WHERE id = $1 LIMIT 1', [reviewId]);
    if (!before.rows[0]) return null;
    const after = await client.query('UPDATE avis SET est_visible = $1 WHERE id = $2 RETURNING *', [visible, reviewId]);
    return { before: before.rows[0], after: after.rows[0] };
  });

const listDisputes = async (filters = {}) => {
  const params = [];
  const where = [];

  if (filters.search) {
    addSearchClause({
      filters,
      params,
      where,
      textSql: "LOWER(CONCAT_WS(' ', li.sujet, li.description, l.titre, o.nom, o.prenom, a.nom, a.prenom)) LIKE __PARAM__",
      idColumns: ['li.id', 'li.id_reservation', 'li.id_ouverture', 'li.id_assigne', 'li.id_conversation'],
    });
  }
  if (filters.statut) {
    where.push(`li.statut = ${addParam(params, filters.statut)}`);
  }

  const result = await database.query(
    `
      SELECT
        li.*,
        o.nom AS auteur_nom, o.prenom AS auteur_prenom, o.email AS auteur_email,
        a.nom AS assigne_nom, a.prenom AS assigne_prenom, a.email AS assigne_email,
        r.statut AS reservation_statut, r.date_arrivee, r.date_depart, r.montant_total,
        l.id AS logement_id, l.titre AS logement_titre, l.ville AS logement_ville,
        v.id AS voyageur_id, v.nom AS voyageur_nom, v.prenom AS voyageur_prenom,
        h.id AS hote_id, h.nom AS hote_nom, h.prenom AS hote_prenom
      FROM litige li
      JOIN utilisateur o ON o.id = li.id_ouverture
      LEFT JOIN utilisateur a ON a.id = li.id_assigne
      LEFT JOIN reservation r ON r.id = li.id_reservation
      LEFT JOIN logement l ON l.id = r.id_logement
      LEFT JOIN utilisateur v ON v.id = r.id_voyageur
      LEFT JOIN utilisateur h ON h.id = l.id_hote
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY li.date_creation DESC
      ${limitClause(params, filters)}
    `,
    params
  );
  return result.rows;
};

const createDispute = async ({ id_reservation, id_ouverture, id_assigne, id_conversation, sujet, description, priorite }) =>
  database.withTransaction(async (client) => {
    let conversationId = id_conversation || null;
    if (!conversationId && id_ouverture && id_assigne && Number(id_ouverture) !== Number(id_assigne)) {
      const user1 = Math.min(Number(id_ouverture), Number(id_assigne));
      const user2 = Math.max(Number(id_ouverture), Number(id_assigne));
      const conversationResult = await client.query(
        `
          INSERT INTO conversation (id_utilisateur1, id_utilisateur2)
          VALUES ($1, $2)
          ON CONFLICT (id_utilisateur1, id_utilisateur2)
          DO UPDATE SET date_mise_a_jour = NOW()
          RETURNING id
        `,
        [user1, user2]
      );
      conversationId = conversationResult.rows[0].id;
    }

    const result = await client.query(
      `
        INSERT INTO litige (id_reservation, id_ouverture, id_assigne, id_conversation, sujet, description, priorite)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [id_reservation, id_ouverture, id_assigne, conversationId, sujet, description, priorite]
    );

    if (conversationId && id_assigne) {
      await client.query(
        `
          INSERT INTO message (id_conversation, id_expediteur, contenu)
          VALUES ($1, $2, $3)
        `,
        [conversationId, id_assigne, `Litige cree par la moderation : ${description}`]
      );
      await client.query('UPDATE conversation SET date_mise_a_jour = NOW() WHERE id = $1', [conversationId]);
    }

    return result.rows[0];
  });

const updateDispute = async ({ disputeId, payload }) =>
  database.withTransaction(async (client) => {
    const before = await client.query('SELECT * FROM litige WHERE id = $1 LIMIT 1', [disputeId]);
    if (!before.rows[0]) return null;
    const after = await client.query(
      `
        UPDATE litige
        SET statut = COALESCE($1, statut),
            priorite = COALESCE($2, priorite),
            id_assigne = COALESCE($3, id_assigne),
            resolution_note = COALESCE($4, resolution_note),
            date_resolution = CASE WHEN COALESCE($1, statut) IN ('resolu', 'ferme') THEN COALESCE(date_resolution, NOW()) ELSE NULL END,
            date_mise_a_jour = NOW()
        WHERE id = $5
        RETURNING *
      `,
      [
        payload.statut || null,
        payload.priorite || null,
        payload.id_assigne || null,
        payload.resolution_note || null,
        disputeId,
      ]
    );
    return { before: before.rows[0], after: after.rows[0] };
  });

const logAction = async ({ adminId, action, targetType, targetId, before, after, note }) => {
  const result = await database.query(
    `
      INSERT INTO admin_action (id_admin, action, cible_type, cible_id, ancienne_valeur, nouvelle_valeur, note)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [adminId || null, action, targetType, targetId || null, before || null, after || null, note || null]
  );
  return result.rows[0];
};

const listActions = async (filters = {}) => {
  const params = [];
  const where = [];

  if (filters.cible_type) {
    where.push(`aa.cible_type = ${addParam(params, filters.cible_type)}`);
  }
  if (filters.cible_id) {
    where.push(`aa.cible_id = ${addParam(params, filters.cible_id)}`);
  }
  if (filters.search) {
    addSearchClause({
      filters,
      params,
      where,
      textSql: "LOWER(CONCAT_WS(' ', aa.action, aa.cible_type, aa.note, u.nom, u.prenom, u.email)) LIKE __PARAM__",
      idColumns: ['aa.id', 'aa.cible_id', 'aa.id_admin'],
    });
  }

  const result = await database.query(
    `
      SELECT
        aa.*,
        u.nom AS admin_nom,
        u.prenom AS admin_prenom,
        u.email AS admin_email
      FROM admin_action aa
      LEFT JOIN utilisateur u ON u.id = aa.id_admin
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY aa.date_action DESC
      ${limitClause(params, filters)}
    `,
    params
  );
  return result.rows;
};

module.exports = {
  createDispute,
  findUserForAdmin,
  getStats,
  listActions,
  listConversationMessages,
  listConversations,
  listDisputes,
  listListings,
  listReservations,
  listReviews,
  listUsers,
  logAction,
  updateDispute,
  updateListingPublication,
  updateListingValidation,
  updateMessageVisibility,
  updateReservationStatus,
  updateReviewVisibility,
  updateUserStatus,
  updateUserVerification,
};
