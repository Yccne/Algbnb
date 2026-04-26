const database = require('./database.repository');

const reminderAlreadySent = async ({ userId, type, reservationId }) => {
  const result = await database.query(
    `
      SELECT 1
      FROM notification
      WHERE id_utilisateur = $1
        AND type = $2
        AND meta ->> 'reservationId' = $3
      LIMIT 1
    `,
    [userId, type, String(reservationId)]
  );
  return result.rows.length > 0;
};

const findUpcomingConfirmedReservations = async () => {
  const result = await database.query(`
    SELECT
      r.id,
      r.id_logement,
      r.date_arrivee,
      r.date_depart,
      r.nb_voyageurs,
      l.titre,
      l.ville,
      h.id AS hote_id,
      h.nom AS hote_nom,
      h.prenom AS hote_prenom,
      h.email AS hote_email,
      v.id AS voyageur_id,
      v.nom AS voyageur_nom,
      v.prenom AS voyageur_prenom,
      v.email AS voyageur_email
    FROM reservation r
    JOIN logement l ON l.id = r.id_logement
    JOIN utilisateur h ON h.id = l.id_hote
    JOIN utilisateur v ON v.id = r.id_voyageur
    WHERE r.statut = 'confirmee'
      AND r.date_arrivee >= CURRENT_DATE
      AND r.date_arrivee <= CURRENT_DATE + INTERVAL '3 days'
    ORDER BY r.date_arrivee ASC
  `);
  return result.rows;
};

module.exports = {
  findUpcomingConfirmedReservations,
  reminderAlreadySent,
};
