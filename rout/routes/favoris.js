const express = require('express');
const db = require('../db');
const { verifierToken } = require('../middlewares/ann');
const { listingSelect, listingGroupBy } = require('../utils/listings');

const router = express.Router();

router.get('/', verifierToken, async (req, res) => {
  try {
    const result = await db.query(
      `
        ${listingSelect}
        JOIN voyageur_favori vf ON vf.id_logement = l.id
        WHERE vf.id_voyageur = $1
          AND l.est_supprime = FALSE
        ${listingGroupBy}
        ORDER BY vf.date_ajout DESC
      `,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.post('/:logementId', verifierToken, async (req, res) => {
  try {
    await db.query(
      `
        INSERT INTO voyageur_favori (id_voyageur, id_logement)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [req.user.id, req.params.logementId]
    );
    return res.status(201).json({ message: 'Favori ajouté.' });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.delete('/:logementId', verifierToken, async (req, res) => {
  try {
    await db.query('DELETE FROM voyageur_favori WHERE id_voyageur = $1 AND id_logement = $2', [
      req.user.id,
      req.params.logementId,
    ]);
    return res.json({ message: 'Favori supprimé.' });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

module.exports = router;
