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

const hasReservationConflict = async ({ listingId, startDate, endDate }) => {
  const result = await database.query(
    `
      SELECT 1
      FROM reservation r
      WHERE r.id_logement = $1
        AND r.statut = ANY($2::text[])
        AND NOT (r.date_depart <= $3 OR r.date_arrivee >= $4)
      LIMIT 1
    `,
    [listingId, activeReservationStatuses, startDate, endDate]
  );
  return result.rows.length > 0;
};

const hasBlockedAvailability = async ({ listingId, startDate, endDate }) => {
  const result = await database.query(
    `
      SELECT 1
      FROM disponibilite d
      WHERE d.id_logement = $1
        AND d.est_bloque = TRUE
        AND NOT (d.date_fin < $2 OR d.date_debut >= $3)
      LIMIT 1
    `,
    [listingId, startDate, endDate]
  );
  return result.rows.length > 0;
};

const createReservation = async ({ reservation, blockDates, notifications }) =>
  database.withTransaction(async (client) => {
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
        SET statut = $1, date_annulation = NOW(), motif_annulation = $2
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

const updateStatus = async ({ reservation, status, notification }) =>
  database.withTransaction(async (client) => {
    const updated = await client.query('UPDATE reservation SET statut = $1 WHERE id = $2 RETURNING *', [
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
  findReservationForStatus,
  findUser,
  hasBlockedAvailability,
  hasReservationConflict,
  listByHost,
  listByTraveler,
  updateStatus,
};
