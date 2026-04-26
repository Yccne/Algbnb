const database = require('./database.repository');

const isUniqueViolation = (error) => error.code === '23505';

const listByListing = async (listingId) => {
  const result = await database.query(
    `
      SELECT
        a.*,
        u.nom AS voyageur_nom,
        u.prenom AS voyageur_prenom,
        u.photo_profil AS voyageur_photo
      FROM avis a
      JOIN utilisateur u ON u.id = a.id_voyageur
      WHERE a.id_logement = $1
        AND a.est_visible = TRUE
      ORDER BY a.date_avis DESC
    `,
    [listingId]
  );
  return result.rows;
};

const findReservationForReview = async (reservationId) => {
  const result = await database.query(
    `
      SELECT r.*, l.id_hote
      FROM reservation r
      JOIN logement l ON l.id = r.id_logement
      WHERE r.id = $1
      LIMIT 1
    `,
    [reservationId]
  );
  return result.rows[0] || null;
};

const create = async ({ voyageurId, reservation, note_logement, note_hote, commentaire }) => {
  const result = await database.query(
    `
      INSERT INTO avis (id_voyageur, id_hote, id_logement, id_reservation, note_logement, note_hote, commentaire)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      voyageurId,
      reservation.id_hote,
      reservation.id_logement,
      reservation.id,
      note_logement,
      note_hote,
      commentaire,
    ]
  );
  return result.rows[0];
};

const updateVisibility = async ({ reviewId, visible }) => {
  const result = await database.query(
    'UPDATE avis SET est_visible = $1 WHERE id = $2 RETURNING *',
    [visible, reviewId]
  );
  return result.rows[0] || null;
};

module.exports = {
  create,
  findReservationForReview,
  isUniqueViolation,
  listByListing,
  updateVisibility,
};
