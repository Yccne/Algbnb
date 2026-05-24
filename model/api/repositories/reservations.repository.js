const database = require('./database.repository');
const notificationsRepository = require('./notifications.repository');

const activeReservationStatuses = ['en_attente', 'confirmee', 'terminee'];

const reservationSelect = `
  SELECT
    r.*,
    l.titre,
    l.adresse,
    l.ville,
    l.prix_par_nuit AS logement_prix_par_nuit,
    l.id_hote,
    av.id AS review_id,
    (av.id IS NOT NULL) AS has_review,
    u.nom AS hote_nom,
    u.prenom AS hote_prenom,
    COALESCE((
      SELECT ARRAY_REMOVE(ARRAY_AGG(lp.url_photo ORDER BY lp.ordre_affichage), NULL)
      FROM logement_photo lp
      WHERE lp.id_logement = l.id
    ), '{}') AS photos
  FROM reservation r
  JOIN logement l ON l.id = r.id_logement
  JOIN utilisateur u ON u.id = l.id_hote
  LEFT JOIN avis av ON av.id_reservation = r.id
`;

const listByTraveler = async (travelerId) => {
  const result = await database.query(
    `
      ${reservationSelect}
      WHERE r.id_voyageur = $1
      ORDER BY r.date_reservation DESC
    `,
    [travelerId]
  );
  return result.rows;
};

const listByHost = async (hostId) => {
  const result = await database.query(
    `
      SELECT
        r.*,
        l.titre,
        l.ville,
        v.nom AS voyageur_nom,
        v.prenom AS voyageur_prenom,
        v.photo_profil AS voyageur_photo
      FROM reservation r
      JOIN logement l ON l.id = r.id_logement
      JOIN utilisateur v ON v.id = r.id_voyageur
      WHERE l.id_hote = $1
      ORDER BY r.date_reservation DESC
    `,
    [hostId]
  );
  return result.rows;
};

const findUser = async (userId) => {
  const result = await database.query(
    `
      SELECT id, nom, prenom, email
      FROM utilisateur
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );
  return result.rows[0] || null;
};

const findAvailableListing = async (listingId) => {
  const result = await database.query(
    `
      SELECT
        l.*,
        h.nom AS hote_nom,
        h.prenom AS hote_prenom,
        h.email AS hote_email
      FROM logement l
      JOIN utilisateur h ON h.id = l.id_hote
      WHERE l.id = $1
        AND l.est_supprime = FALSE
        AND l.est_actif = TRUE
        AND l.validation_statut = 'valide'
      LIMIT 1
    `,
    [listingId]
  );
  return result.rows[0] || null;
};

const reservationConflictSql = ({ excludeReservationId = false } = {}) => `
  SELECT 1
  FROM reservation r
  WHERE r.id_logement = $1
    AND r.statut = ANY($2::text[])
    ${excludeReservationId ? 'AND r.id <> $5' : ''}
    AND NOT (r.date_depart <= $3 OR r.date_arrivee >= $4)
  LIMIT 1
`;

const blockedAvailabilityConflictSql = `
  SELECT 1
  FROM disponibilite d
  WHERE d.id_logement = $1
    AND d.est_bloque = TRUE
    AND NOT (d.date_fin < $2 OR d.date_debut >= $3)
  LIMIT 1
`;

const hasReservationConflict = async ({ listingId, startDate, endDate, excludeReservationId }) => {
  const params = [listingId, activeReservationStatuses, startDate, endDate];
  if (excludeReservationId) params.push(excludeReservationId);
  const result = await database.query(
    `
      ${reservationConflictSql({ excludeReservationId: Boolean(excludeReservationId) })}
    `,
    params
  );
  return result.rows.length > 0;
};

const hasBlockedAvailability = async ({ listingId, startDate, endDate }) => {
  const result = await database.query(
    `
      ${blockedAvailabilityConflictSql}
    `,
    [listingId, startDate, endDate]
  );
  return result.rows.length > 0;
};

const createConflictError = (message) => {
  const error = new Error(message);
  error.code = 'RESERVATION_CONFLICT';
  return error;
};

const createReservation = async ({ reservation, blockDates, notifications }) =>
  database.withTransaction(async (client) => {
    await client.query('SELECT id FROM logement WHERE id = $1 FOR UPDATE', [reservation.listingId]);

    const reservationConflict = await client.query(
      reservationConflictSql(),
      [reservation.listingId, activeReservationStatuses, reservation.startDate, reservation.endDate]
    );
    if (reservationConflict.rows.length > 0) {
      throw createConflictError('Ce logement a deja une reservation sur cette periode.');
    }

    const blockConflict = await client.query(
      blockedAvailabilityConflictSql,
      [reservation.listingId, reservation.startDate, reservation.endDate]
    );
    if (blockConflict.rows.length > 0) {
      throw createConflictError('Ces dates sont bloquees par l hote.');
    }

    const result = await client.query(
      `
        INSERT INTO reservation (
          id_voyageur, id_logement, date_arrivee, date_depart, nb_voyageurs,
          prix_par_nuit, sous_total, frais_service, montant_total,
          statut, politique_annulation, mode_confirmation
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `,
      [
        reservation.travelerId,
        reservation.listingId,
        reservation.startDate,
        reservation.endDate,
        reservation.guestCount,
        reservation.pricePerNight,
        reservation.subTotal,
        reservation.serviceFee,
        reservation.total,
        reservation.status,
        reservation.cancellationPolicy,
        reservation.confirmationMode,
      ]
    );

    const created = result.rows[0];
    if (blockDates) {
      await client.query(
        `
          INSERT INTO disponibilite (id_logement, date_debut, date_fin, est_bloque, source_blocage, note_interne)
          VALUES ($1, $2, $3, TRUE, 'reservation', $4)
        `,
        [reservation.listingId, reservation.startDate, reservation.endDate, `Reservation #${created.id}`]
      );
    }

    for (const notification of notifications(created)) {
      await notificationsRepository.insertNotification(
        client,
        notification.userId,
        notification.type,
        notification.contenu,
        notification.meta
      );
    }

    return created;
  });

const findReservationForCancellation = async (reservationId) => {
  const result = await database.query(
    `
      SELECT
        r.*,
        l.id_hote,
        l.titre,
        h.email AS hote_email,
        h.nom AS hote_nom,
        h.prenom AS hote_prenom,
        v.email AS voyageur_email,
        v.nom AS voyageur_nom,
        v.prenom AS voyageur_prenom
      FROM reservation r
      JOIN logement l ON l.id = r.id_logement
      JOIN utilisateur h ON h.id = l.id_hote
      JOIN utilisateur v ON v.id = r.id_voyageur
      WHERE r.id = $1
      LIMIT 1
    `,
    [reservationId]
  );
  return result.rows[0] || null;
};

const cancelReservation = async ({ reservation, status, reason }) =>
  database.withTransaction(async (client) => {
    const updated = await client.query(
      `
        UPDATE reservation
        SET statut = $1::text, date_annulation = NOW(), motif_annulation = $2
        WHERE id = $3
        RETURNING *
      `,
      [status, reason || null, reservation.id]
    );

    await client.query(
      `
        DELETE FROM disponibilite
        WHERE id_logement = $1
          AND source_blocage = 'reservation'
          AND date_debut = $2
          AND date_fin = $3
      `,
      [reservation.id_logement, reservation.date_arrivee, reservation.date_depart]
    );

    await client.query(
      `
        UPDATE paiement
        SET statut = 'rembourse'
        WHERE id_reservation = $1
          AND statut = 'paye'
      `,
      [reservation.id]
    );

    return updated.rows[0];
  });

const findReservationForStatus = async (reservationId) => {
  const result = await database.query(
    `
      SELECT
        r.*,
        l.id_hote,
        l.id AS logement_id,
        l.titre,
        v.email AS voyageur_email,
        v.nom AS voyageur_nom,
        v.prenom AS voyageur_prenom
      FROM reservation r
      JOIN logement l ON l.id = r.id_logement
      JOIN utilisateur v ON v.id = r.id_voyageur
      WHERE r.id = $1
      LIMIT 1
    `,
    [reservationId]
  );
  return result.rows[0] || null;
};

const findReservationForDispute = async (reservationId) => {
  const result = await database.query(
    `
      SELECT
        r.*,
        l.id_hote,
        l.titre,
        l.ville,
        h.email AS hote_email,
        h.nom AS hote_nom,
        h.prenom AS hote_prenom,
        v.email AS voyageur_email,
        v.nom AS voyageur_nom,
        v.prenom AS voyageur_prenom
      FROM reservation r
      JOIN logement l ON l.id = r.id_logement
      JOIN utilisateur h ON h.id = l.id_hote
      JOIN utilisateur v ON v.id = r.id_voyageur
      WHERE r.id = $1
      LIMIT 1
    `,
    [reservationId]
  );
  return result.rows[0] || null;
};

const openDisputeConversation = async ({ reservation, openerId, initialMessage }) =>
  database.withTransaction(async (client) => {
    const adminResult = await client.query(
      `
        SELECT id, nom, prenom, email
        FROM utilisateur
        WHERE role_type = 'admin'
          AND statut_compte = 'actif'
        ORDER BY id ASC
        LIMIT 1
      `
    );
    const admin = adminResult.rows[0] || null;
    if (!admin) {
      const error = new Error('Aucun administrateur support actif n est disponible.');
      error.code = 'SUPPORT_ADMIN_MISSING';
      throw error;
    }

    const user1 = Math.min(Number(openerId), Number(admin.id));
    const user2 = Math.max(Number(openerId), Number(admin.id));
    const conversationResult = await client.query(
      `
        INSERT INTO conversation (id_utilisateur1, id_utilisateur2)
        VALUES ($1, $2)
        ON CONFLICT (id_utilisateur1, id_utilisateur2)
        DO UPDATE SET date_mise_a_jour = conversation.date_mise_a_jour
        RETURNING *
      `,
      [user1, user2]
    );
    const conversation = conversationResult.rows[0];

    const existingResult = await client.query(
      `
        SELECT *
        FROM litige
        WHERE id_reservation = $1
          AND id_ouverture = $2
          AND statut IN ('ouvert', 'en_cours')
        ORDER BY date_creation DESC
        LIMIT 1
      `,
      [reservation.id, openerId]
    );

    const messageContent =
      String(initialMessage || '').trim() ||
      `Litige ouvert pour la reservation #${reservation.id} (${reservation.titre}).`;

    let dispute = existingResult.rows[0] || null;
    if (!dispute) {
      const disputeResult = await client.query(
        `
          INSERT INTO litige (
            id_reservation, id_ouverture, id_assigne, id_conversation,
            sujet, description, statut, priorite
          )
          VALUES ($1, $2, $3, $4, $5, $6, 'ouvert', 'normale')
          RETURNING *
        `,
        [
          reservation.id,
          openerId,
          admin.id,
          conversation.id,
          `Reservation #${reservation.id} - ${reservation.titre}`,
          messageContent,
        ]
      );
      dispute = disputeResult.rows[0];
    } else if (!dispute.id_conversation) {
      const updatedDispute = await client.query(
        `
          UPDATE litige
          SET id_conversation = $1,
              id_assigne = COALESCE(id_assigne, $2),
              date_mise_a_jour = NOW()
          WHERE id = $3
          RETURNING *
        `,
        [conversation.id, admin.id, dispute.id]
      );
      dispute = updatedDispute.rows[0];
    }

    await client.query(
      `
        INSERT INTO message (id_conversation, id_expediteur, contenu)
        VALUES ($1, $2, $3)
      `,
      [conversation.id, openerId, messageContent]
    );
    await client.query('UPDATE conversation SET date_mise_a_jour = NOW() WHERE id = $1', [conversation.id]);

    await notificationsRepository.insertNotification(client, admin.id, 'litige', `Nouveau litige sur la reservation #${reservation.id}.`, {
      reservationId: reservation.id,
      litigeId: dispute.id,
      conversationId: conversation.id,
    });

    return { dispute, conversation, admin };
  });

const updateStatus = async ({ reservation, status, notification }) =>
  database.withTransaction(async (client) => {
    await client.query('SELECT id FROM logement WHERE id = $1 FOR UPDATE', [reservation.logement_id]);
    if (status === 'confirmee') {
      const reservationConflict = await client.query(
        reservationConflictSql({ excludeReservationId: true }),
        [
          reservation.logement_id,
          activeReservationStatuses,
          reservation.date_arrivee,
          reservation.date_depart,
          reservation.id,
        ]
      );
      if (reservationConflict.rows.length > 0) {
        throw createConflictError('Ce logement a deja une reservation sur cette periode.');
      }

      const blockConflict = await client.query(
        blockedAvailabilityConflictSql,
        [reservation.logement_id, reservation.date_arrivee, reservation.date_depart]
      );
      if (blockConflict.rows.length > 0) {
        throw createConflictError('Ces dates sont bloquees par l hote.');
      }
    }

    const updated = await client.query('UPDATE reservation SET statut = $1::text WHERE id = $2 RETURNING *', [
      status,
      reservation.id,
    ]);

    if (status === 'confirmee') {
      await client.query(
        `
          INSERT INTO disponibilite (id_logement, date_debut, date_fin, est_bloque, source_blocage, note_interne)
          VALUES ($1, $2, $3, TRUE, 'reservation', $4)
          ON CONFLICT DO NOTHING
        `,
        [reservation.logement_id, reservation.date_arrivee, reservation.date_depart, `Reservation #${reservation.id}`]
      );
    }

    if (status === 'refusee') {
      await client.query(
        `
          DELETE FROM disponibilite
          WHERE id_logement = $1
            AND source_blocage = 'reservation'
            AND date_debut = $2
            AND date_fin = $3
        `,
        [reservation.logement_id, reservation.date_arrivee, reservation.date_depart]
      );
    }

    if (['refusee', 'annulee_hote', 'annulee_voyageur', 'annulee_admin'].includes(status)) {
      await client.query(
        `
          UPDATE paiement
          SET statut = 'rembourse'
          WHERE id_reservation = $1
            AND statut = 'paye'
        `,
        [reservation.id]
      );
    }

    await notificationsRepository.insertNotification(
      client,
      notification.userId,
      notification.type,
      notification.contenu,
      notification.meta
    );
    return updated.rows[0];
  });

module.exports = {
  cancelReservation,
  createReservation,
  findAvailableListing,
  findReservationForCancellation,
  findReservationForDispute,
  findReservationForStatus,
  findUser,
  hasBlockedAvailability,
  hasReservationConflict,
  listByHost,
  listByTraveler,
  openDisputeConversation,
  updateStatus,
};
