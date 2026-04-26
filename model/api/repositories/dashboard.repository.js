const database = require('./database.repository');

const getHostStats = (hostId) =>
  database.query(
    `
      SELECT
        COUNT(DISTINCT l.id) FILTER (WHERE l.est_actif = TRUE AND l.est_supprime = FALSE) AS nb_annonces_actives,
        COUNT(DISTINCT r.id) AS nb_reservations_total,
        COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'confirmee') AS nb_reservations_confirmees,
        COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'en_attente') AS nb_reservations_en_attente,
        COUNT(DISTINCT r.id) FILTER (WHERE r.statut IN ('annulee_hote', 'annulee_voyageur')) AS nb_annulations,
        COALESCE(SUM(r.montant_total) FILTER (WHERE r.statut IN ('confirmee', 'terminee')), 0) AS revenu_total,
        COALESCE(ROUND(AVG(a.note_hote)::numeric, 2), 0) AS note_moyenne_hote
      FROM logement l
      LEFT JOIN reservation r ON r.id_logement = l.id
      LEFT JOIN avis a ON a.id_hote = l.id_hote AND a.est_visible = TRUE
      WHERE l.id_hote = $1
        AND l.est_supprime = FALSE
    `,
    [hostId]
  );

const getHostListings = (hostId) =>
  database.query(
    `
      SELECT
        l.*,
        COALESCE((
          SELECT ARRAY_REMOVE(ARRAY_AGG(lp.url_photo ORDER BY lp.ordre_affichage), NULL)
          FROM logement_photo lp
          WHERE lp.id_logement = l.id
        ), '{}') AS photos,
        COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'confirmee') AS nb_reservations,
        COALESCE(SUM(r.montant_total) FILTER (WHERE r.statut IN ('confirmee', 'terminee')), 0) AS revenu,
        COALESCE(ROUND(AVG(a.note_logement)::numeric, 2), 0) AS note_moyenne
      FROM logement l
      LEFT JOIN reservation r ON r.id_logement = l.id
      LEFT JOIN avis a ON a.id_logement = l.id AND a.est_visible = TRUE
      WHERE l.id_hote = $1
        AND l.est_supprime = FALSE
      GROUP BY l.id
      ORDER BY l.date_creation DESC
    `,
    [hostId]
  );

const getHostReservations = (hostId) =>
  database.query(
    `
      SELECT
        r.*,
        l.titre AS logement_titre,
        v.nom AS voyageur_nom,
        v.prenom AS voyageur_prenom,
        v.photo_profil AS voyageur_photo
      FROM reservation r
      JOIN logement l ON l.id = r.id_logement
      JOIN utilisateur v ON v.id = r.id_voyageur
      WHERE l.id_hote = $1
      ORDER BY r.date_reservation DESC
      LIMIT 10
    `,
    [hostId]
  );

const getHostMonthlyRevenue = (hostId) =>
  database.query(
    `
      SELECT
        TO_CHAR(DATE_TRUNC('month', r.date_reservation), 'YYYY-MM') AS mois,
        COALESCE(SUM(r.montant_total), 0) AS revenu
      FROM reservation r
      JOIN logement l ON l.id = r.id_logement
      WHERE l.id_hote = $1
        AND r.statut IN ('confirmee', 'terminee')
        AND r.date_reservation >= NOW() - INTERVAL '6 months'
      GROUP BY mois
      ORDER BY mois ASC
    `,
    [hostId]
  );

const getHostNotifications = (hostId) =>
  database.query(
    `
      SELECT *
      FROM notification
      WHERE id_utilisateur = $1
      ORDER BY date_envoi DESC
      LIMIT 10
    `,
    [hostId]
  );

module.exports = {
  getHostListings,
  getHostMonthlyRevenue,
  getHostNotifications,
  getHostReservations,
  getHostStats,
};
