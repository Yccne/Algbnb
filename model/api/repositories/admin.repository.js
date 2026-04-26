const database = require('./database.repository');

const getStats = async () => {
  const result = await database.query(`
    SELECT
      (SELECT COUNT(*) FROM utilisateur) AS nb_utilisateurs,
      (SELECT COUNT(*) FROM utilisateur WHERE role_type = 'hote') AS nb_hotes,
      (SELECT COUNT(*) FROM utilisateur WHERE role_type = 'voyageur') AS nb_voyageurs,
      (SELECT COUNT(*) FROM logement WHERE est_supprime = FALSE) AS nb_annonces,
      (SELECT COUNT(*) FROM reservation) AS nb_reservations,
      (SELECT COALESCE(SUM(montant_total), 0) FROM reservation WHERE statut IN ('confirmee', 'terminee')) AS revenu_total,
      (
        SELECT COALESCE(
          ROUND(
            COUNT(*) FILTER (WHERE statut IN ('annulee_hote', 'annulee_voyageur')) * 100.0 / NULLIF(COUNT(*), 0),
            2
          ),
          0
        )
        FROM reservation
      ) AS taux_annulation
  `);
  return result.rows[0];
};

const listUsers = async () => {
  const result = await database.query(`
    SELECT id, nom, prenom, email, telephone, role_type, statut_compte, est_verifie, date_inscription
    FROM utilisateur
    ORDER BY date_inscription DESC
  `);
  return result.rows;
};

const updateUserStatus = async ({ userId, status }) => {
  const result = await database.query(
    'UPDATE utilisateur SET statut_compte = $1, date_mise_a_jour = NOW() WHERE id = $2 RETURNING id, statut_compte',
    [status, userId]
  );
  return result.rows[0] || null;
};

const listListings = async () => {
  const result = await database.query(`
    SELECT
      l.id,
      l.titre,
      l.ville,
      l.validation_statut,
      l.est_actif,
      l.date_creation,
      u.nom AS hote_nom,
      u.prenom AS hote_prenom
    FROM logement l
    JOIN utilisateur u ON u.id = l.id_hote
    WHERE l.est_supprime = FALSE
    ORDER BY l.date_creation DESC
  `);
  return result.rows;
};

const updateListingValidation = async ({ listingId, status }) => {
  const result = await database.query(
    `
      UPDATE logement
      SET validation_statut = $1,
          est_actif = CASE WHEN $1 = 'valide' THEN est_actif ELSE FALSE END,
          date_mise_a_jour = NOW()
      WHERE id = $2
      RETURNING id, validation_statut, est_actif
    `,
    [status, listingId]
  );
  return result.rows[0] || null;
};

const listDisputes = async () => {
  const result = await database.query(`
    SELECT
      l.*,
      u.nom AS auteur_nom,
      u.prenom AS auteur_prenom
    FROM litige l
    JOIN utilisateur u ON u.id = l.id_ouverture
    ORDER BY l.date_creation DESC
  `);
  return result.rows;
};

const createDispute = async ({ id_reservation, id_ouverture, sujet, description }) => {
  const result = await database.query(
    `
      INSERT INTO litige (id_reservation, id_ouverture, sujet, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [id_reservation, id_ouverture, sujet, description]
  );
  return result.rows[0];
};

module.exports = {
  createDispute,
  getStats,
  listDisputes,
  listListings,
  listUsers,
  updateListingValidation,
  updateUserStatus,
};
