const express = require('express');
const router = express.Router();
const pool = require('../db');

// Récupérer tous les logements
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.nom, u.prenom, u.photo_profil,
       ARRAY_AGG(DISTINCT p.url_photo) as photos,
       ARRAY_AGG(DISTINCT e.nom_equipement) as equipements
       FROM logement l
       JOIN utilisateur u ON l.id_hote = u.id
       LEFT JOIN logement_photo p ON l.id = p.id_logement
       LEFT JOIN logement_equipement e ON l.id = e.id_logement
       WHERE l.est_actif = true
       GROUP BY l.id, u.nom, u.prenom, u.photo_profil`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Récupérer un logement par ID
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, u.nom, u.prenom, u.photo_profil,
       ARRAY_AGG(DISTINCT p.url_photo) as photos,
       ARRAY_AGG(DISTINCT e.nom_equipement) as equipements
       FROM logement l
       JOIN utilisateur u ON l.id_hote = u.id
       LEFT JOIN logement_photo p ON l.id = p.id_logement
       LEFT JOIN logement_equipement e ON l.id = e.id_logement
       WHERE l.id = $1
       GROUP BY l.id, u.nom, u.prenom, u.photo_profil`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erreur: 'Logement non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Créer un logement
router.post('/', async (req, res) => {
  const { id_hote, titre, description, type_logement, adresse, latitude, longitude,
    nb_chambres, nb_lits, nb_salles_de_bain, capacite_accueil, prix_par_nuit } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO logement (id_hote, titre, description, type_logement, adresse, latitude, longitude,
       nb_chambres, nb_lits, nb_salles_de_bain, capacite_accueil, prix_par_nuit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [id_hote, titre, description, type_logement, adresse, latitude, longitude,
        nb_chambres, nb_lits, nb_salles_de_bain, capacite_accueil, prix_par_nuit]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Supprimer un logement
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM logement WHERE id = $1', [req.params.id]);
    res.json({ message: 'Logement supprimé ✅' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;