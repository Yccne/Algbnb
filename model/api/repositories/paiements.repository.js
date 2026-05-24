const database = require('./database.repository');

const createPaiement = async ({ reservationId, montant, devise = 'DZD' }) => {
  const reference = `DAH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const result = await database.query(
    `INSERT INTO paiement
       (id_reservation, montant, devise, statut, methode_paiement, reference_transaction)
     VALUES ($1, $2, $3, 'paye', 'dahabiya', $4)
     ON CONFLICT (id_reservation) DO NOTHING
     RETURNING *`,
    [reservationId, montant, devise, reference]
  );

  if (result.rows[0]) {
    return result.rows[0];
  }

  return findByReservation(reservationId);
};

const findByReservation = async (reservationId) => {
  const result = await database.query('SELECT * FROM paiement WHERE id_reservation = $1', [reservationId]);
  return result.rows[0] || null;
};

module.exports = { createPaiement, findByReservation };
