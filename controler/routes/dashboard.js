const express = require('express');
const router = express.Router();
const pool = require('../db');


router.get('/hote/:id', async (req, res) => {
  const id_hote = req.params.id;
  try {
    // --- 1. Statistiques globales ---
    const statsResult = await pool.query(
      `SELECT
         COUNT(DISTINCT r.id)                                          AS nb_reservations_total,
         COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'confirmee')   AS nb_reservations_confirmees,
         COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'en_attente')  AS nb_reservations_en_attente,
         COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'annulee')     AS nb_annulations,
         COALESCE(SUM(r.montant_total) FILTER (WHERE r.statut = 'confirmee'), 0) AS revenu_total,
         COUNT(DISTINCT l.id)                                          AS nb_logements_actifs,
         ROUND(
           CASE WHEN COUNT(DISTINCT r.id) FILTER (WHERE r.statut != 'annulee') > 0
                THEN COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'annulee') * 100.0
                     / COUNT(DISTINCT r.id)
                ELSE 0 END, 2
         )                                                             AS taux_annulation,
         COALESCE(AVG(a.note_logement), 0)                            AS note_moyenne
       FROM logement l
       LEFT JOIN reservation r   ON r.id_logement = l.id
       LEFT JOIN avis       a   ON a.id_logement  = l.id
       WHERE l.id_hote = $1 AND l.est_actif = true`,
      [id_hote]
    );

    // --- 2. Liste des logements de l'hôte ---
    const logementsResult = await pool.query(
      `SELECT
         l.id, l.titre, l.adresse, l.type_logement, l.prix_par_nuit, l.est_actif,
         ARRAY_AGG(DISTINCT p.url_photo) AS photos,
         COUNT(DISTINCT r.id) FILTER (WHERE r.statut = 'confirmee') AS nb_reservations,
         COALESCE(SUM(r.montant_total) FILTER (WHERE r.statut = 'confirmee'), 0) AS revenu,
         COALESCE(AVG(a.note_logement), 0) AS note_moyenne
       FROM logement l
       LEFT JOIN logement_photo p ON p.id_logement = l.id
       LEFT JOIN reservation r    ON r.id_logement = l.id
       LEFT JOIN avis a           ON a.id_logement  = l.id
       WHERE l.id_hote = $1
       GROUP BY l.id
       ORDER BY l.date_creation DESC`,
      [id_hote]
    );

    // --- 3. Réservations récentes (10 dernières) ---
    const reservationsResult = await pool.query(
      `SELECT
         r.id, r.statut, r.date_arrivee, r.date_depart,
         r.nb_voyageurs, r.montant_total, r.date_reservation,
         l.titre AS logement_titre,
         u.nom AS voyageur_nom, u.prenom AS voyageur_prenom,
         u.photo_profil AS voyageur_photo
       FROM reservation r
       JOIN logement    l ON l.id = r.id_logement
       JOIN utilisateur u ON u.id = r.id_voyageur
       WHERE l.id_hote = $1
       ORDER BY r.date_reservation DESC
       LIMIT 10`,
      [id_hote]
    );

    // --- 4. Revenus des 6 derniers mois (graphe) ---
    const revenusResult = await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', r.date_reservation), 'YYYY-MM') AS mois,
         COALESCE(SUM(r.montant_total), 0)                           AS revenu
       FROM reservation r
       JOIN logement l ON l.id = r.id_logement
       WHERE l.id_hote = $1
         AND r.statut = 'confirmee'
         AND r.date_reservation >= NOW() - INTERVAL '6 months'
       GROUP BY mois
       ORDER BY mois ASC`,
      [id_hote]
    );

    res.json({
      stats:        statsResult.rows[0],
      logements:    logementsResult.rows,
      reservations: reservationsResult.rows,
      revenus_mois: revenusResult.rows,
    });
  } catch (err) {
    console.error('[dashboard] Erreur:', err.message);
    res.status(500).json({ erreur: err.message });
  }
});


router.patch('/reservations/:id/statut', async (req, res) => {
  const { statut } = req.body;
  const statutsValides = ['confirmee', 'annulee', 'terminee', 'en_attente'];
  if (!statutsValides.includes(statut)) {
    return res.status(400).json({ erreur: 'Statut invalide' });
  }
  try {
    const result = await pool.query(
      `UPDATE reservation SET statut = $1 WHERE id = $2 RETURNING *`,
      [statut, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erreur: 'Réservation non trouvée' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});


router.patch('/logements/:id/actif', async (req, res) => {
  const { est_actif } = req.body;
  try {
    const result = await pool.query(
      `UPDATE logement SET est_actif = $1 WHERE id = $2 RETURNING *`,
      [est_actif, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erreur: 'Logement non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
