const express = require('express');
const db = require('../db');
const { verifierToken } = require('../middlewares/ann');
const { profilUpload } = require('../middlewares/upload');
const { sanitizeUser } = require('../utils/auth');

const router = express.Router();

router.get('/me', verifierToken, async (req, res) => {
  try {
    const userResult = await db.query('SELECT * FROM utilisateur WHERE id = $1 LIMIT 1', [req.user.id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    }

    const statsResult = await db.query(
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
      [req.user.id]
    );

    return res.json({
      user: sanitizeUser(userResult.rows[0]),
      stats: statsResult.rows[0] || { nb_favoris: 0, nb_reservations: 0, nb_annonces: 0 },
    });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.patch('/me', verifierToken, async (req, res) => {
  const { nom, prenom, email, telephone, bio } = req.body;
  if (!nom || !prenom) {
    return res.status(400).json({ erreur: 'Nom et prénom sont obligatoires.' });
  }

  try {
    const result = await db.query(
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
      [nom.trim(), prenom.trim(), email ? email.toLowerCase() : null, telephone || null, bio || null, req.user.id]
    );

    return res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ erreur: 'Cet e-mail ou ce téléphone est déjà utilisé.' });
    }
    return res.status(500).json({ erreur: error.message });
  }
});

router.post('/me/photo', verifierToken, profilUpload.single('photo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ erreur: 'Photo manquante.' });
  }

  const photoPath = `/uploads/profiles/${req.file.filename}`;

  try {
    const result = await db.query(
      'UPDATE utilisateur SET photo_profil = $1, date_mise_a_jour = NOW() WHERE id = $2 RETURNING *',
      [photoPath, req.user.id]
    );
    return res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/:id/public', async (req, res) => {
  try {
    const result = await db.query(
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
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Profil introuvable.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

module.exports = router;
