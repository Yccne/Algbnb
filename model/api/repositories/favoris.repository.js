const database = require('./database.repository');
const { listingSelect, listingGroupBy } = require('../utils/listings');

const listByUser = async (userId) => {
  const result = await database.query(
    `
      ${listingSelect}
      JOIN voyageur_favori vf ON vf.id_logement = l.id
      WHERE vf.id_voyageur = $1
        AND l.est_supprime = FALSE
      ${listingGroupBy}
      ORDER BY MAX(vf.date_ajout) DESC
    `,
    [userId]
  );
  return result.rows;
};

const findListing = async (listingId) => {
  const result = await database.query(
    `
      SELECT id
      FROM logement
      WHERE id = $1
        AND est_supprime = FALSE
      LIMIT 1
    `,
    [listingId]
  );
  return result.rows[0] || null;
};

const add = async ({ userId, listingId }) => {
  await database.query(
    `
      INSERT INTO voyageur_favori (id_voyageur, id_logement)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `,
    [userId, listingId]
  );
};

const remove = async ({ userId, listingId }) => {
  await database.query('DELETE FROM voyageur_favori WHERE id_voyageur = $1 AND id_logement = $2', [
    userId,
    listingId,
  ]);
};

module.exports = {
  add,
  findListing,
  listByUser,
  remove,
};
