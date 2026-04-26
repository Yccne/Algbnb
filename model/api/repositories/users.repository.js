const database = require('./database.repository');

const isUniqueViolation = (error) => error.code === '23505';

const findById = async (userId) => {
  const result = await database.query('SELECT * FROM utilisateur WHERE id = $1 LIMIT 1', [userId]);
  return result.rows[0] || null;
};

const getStats = async (userId) => {
  const result = await database.query(
    `
      SELECT
        COUNT(DISTINCT vf.id_logement) AS nb_favoris,
        COUNT(DISTINCT r.id) FILTER (WHERE r.statut NOT IN ('annulee_voyageur', 'annulee_hote', 'refusee')) AS nb_reservations,
        COUNT(DISTINCT l.id) AS nb_annonces
      FROM utilisateur u
      LEFT JOIN voyageur_favori vf ON vf.id_voyageur = u.id
      LEFT JOIN reservation r ON r.id_voyageur = u.id
      LEFT JOIN logement l ON l.id_hote = u.id AND l.est_supprime = FALSE
      WHERE u.id = $1
      GROUP BY u.id
    `,
    [userId]
  );
  return result.rows[0] || { nb_favoris: 0, nb_reservations: 0, nb_annonces: 0 };
};

const updateProfile = async ({ userId, nom, prenom, email, telephone, bio }) => {
  const result = await database.query(
    `
      UPDATE utilisateur
      SET nom = $1,
          prenom = $2,
          email = $3,
          telephone = $4,
          bio = $5,
          date_mise_a_jour = NOW()
      WHERE id = $6
      RETURNING *
    `,
    [nom, prenom, email, telephone, bio, userId]
  );
  return result.rows[0] || null;
};

const updatePhoto = async ({ userId, photoPath }) => {
  const result = await database.query(
    'UPDATE utilisateur SET photo_profil = $1, date_mise_a_jour = NOW() WHERE id = $2 RETURNING *',
    [photoPath, userId]
  );
  return result.rows[0] || null;
};

const findPublicProfile = async (userId) => {
  const result = await database.query(
    `
      SELECT
        u.id,
        u.nom,
        u.prenom,
        u.photo_profil,
        u.bio,
        u.est_verifie,
        u.verification_niveau,
        u.date_inscription,
        COALESCE(ROUND(AVG(a.note_hote)::numeric, 2), 0) AS note_moyenne_hote,
        COUNT(DISTINCT a.id) AS nb_avis_hote,
        COUNT(DISTINCT l.id) AS nb_annonces
      FROM utilisateur u
      LEFT JOIN avis a ON a.id_hote = u.id AND a.est_visible = TRUE
      LEFT JOIN logement l ON l.id_hote = u.id AND l.est_supprime = FALSE
      WHERE u.id = $1
      GROUP BY u.id
    `,
    [userId]
  );
  return result.rows[0] || null;
};

module.exports = {
  findById,
  findPublicProfile,
  getStats,
  isUniqueViolation,
  updatePhoto,
  updateProfile,
};
