const express = require('express');
const router = express.Router();
const pool = require('../db');

// Récupérer les réservations d'un voyageur
router.get('/voyageur/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, l.titre, l.adresse, l.prix_par_nuit,
       ARRAY_AGG(p.url_photo) as photos
       FROM reservation r
       JOIN logement l ON r.id_logement = l.id
       LEFT JOIN logement_photo p ON l.id = p.id_logement
       WHERE r.id_voyageur = $1
       GROUP BY r.id, l.titre, l.adresse, l.prix_par_nuit`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Créer une réservation
router.post('/', async (req, res) => {
  const { id_voyageur, id_logement, date_arrivee, date_depart, nb_voyageurs, montant_total, politique_annulation } = req.body;
  try {
    // Vérifier chevauchement de dates
    const conflit = await pool.query(
      `SELECT id FROM reservation 
       WHERE id_logement = $1 AND statut != 'annulee'
       AND NOT (date_depart <= $2 OR date_arrivee >= $3)`,
      [id_logement, date_arrivee, date_depart]
    );
    if (conflit.rows.length > 0) return res.status(400).json({ erreur: 'Logement non disponible pour ces dates' });

    const result = await pool.query(
      `INSERT INTO reservation (id_voyageur, id_logement, date_arrivee, date_depart, nb_voyageurs, montant_total, statut, politique_annulation)
       VALUES ($1,$2,$3,$4,$5,$6,'en_attente',$7) RETURNING *`,
      [id_voyageur, id_logement, date_arrivee, date_depart, nb_voyageurs, montant_total, politique_annulation]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Annuler une réservation
router.patch('/:id/annuler', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE reservation SET statut = 'annulee' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;