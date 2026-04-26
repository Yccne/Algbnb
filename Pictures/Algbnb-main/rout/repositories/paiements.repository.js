const database = require('./database.repository');

const createPaiement = async ({ reservationId, montant, devise = 'DZD', numeroCarte, nomPorteur }) => {
  const reference = `DAH-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  const result = await database.query(
    `INSERT INTO paiement
       (id_reservation, montant, devise, statut, methode_paiement, reference_transaction)
     VALUES ($1, $2, $3, 'paye', 'dahabiya', $4)
     ON CONFLICT (id_reservation) DO UPDATE
       SET statut = 'paye',
           methode_paiement = 'dahabiya',
           reference_transaction = $4,
           date_paiement = CURRENT_TIMESTAMP
     RETURNING *`,
    [reservationId, montant, devise, reference]
  );

  return { ...result.rows[0], reference_transaction: reference };
};

const findByReservation = async (reservationId) => {
  const result = await database.query(
    `SELECT * FROM paiement WHERE id_reservation = $1`,
    [reservationId]
  );
  return result.rows[0] || null;
};

module.exports = { createPaiement, findByReservation };