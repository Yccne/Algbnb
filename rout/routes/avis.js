const express = require('express');
const db = require('../db');
const { verifierToken, estAdmin } = require('../middlewares/ann');

const router = express.Router();

router.get('/logement/:id', async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT
          a.*,
          u.nom AS voyageur_nom,
          u.prenom AS voyageur_prenom,
          u.photo_profil AS voyageur_photo
        FROM avis a
        JOIN utilisateur u ON u.id = a.id_voyageur
        WHERE a.id_logement = $1
          AND a.est_visible = TRUE
        ORDER BY a.date_avis DESC
      `,
      [req.params.id]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.post('/', verifierToken, async (req, res) => {
  const { id_reservation, note_logement, note_hote, commentaire } = req.body;
  if (!id_reservation || !note_logement || !note_hote) {
    return res.status(400).json({ erreur: 'Réservation et notes sont requises.' });
  }

  try {
    const reservationResult = await db.query(
      `
        SELECT r.*, l.id_hote
        FROM reservation r
        JOIN logement l ON l.id = r.id_logement
        WHERE r.id = $1
        LIMIT 1
      `,
      [id_reservation]
    );

    if (reservationResult.rows.length === 0) {
      return res.status(404).json({ erreur: 'Réservation introuvable.' });
    }

    const reservation = reservationResult.rows[0];
    if (String(reservation.id_voyageur) !== String(req.user.id)) {
      return res.status(403).json({ erreur: 'Seul le voyageur concerné peut laisser un avis.' });
    }

    const result = await db.query(
      `
        INSERT INTO avis (id_voyageur, id_hote, id_logement, id_reservation, note_logement, note_hote, commentaire)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `,
      [
        req.user.id,
        reservation.id_hote,
        reservation.id_logement,
        id_reservation,
        Number(note_logement),
        Number(note_hote),
        commentaire || null,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ erreur: 'Un avis existe déjà pour cette réservation.' });
    }
    return res.status(500).json({ erreur: error.message });
  }
});

router.patch('/:id/visibility', verifierToken, estAdmin, async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE avis SET est_visible = $1 WHERE id = $2 RETURNING *',
      [Boolean(req.body.est_visible), req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Avis introuvable.' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

module.exports = router;
