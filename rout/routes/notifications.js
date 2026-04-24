const express = require('express');
const db = require('../db');
const { verifierToken } = require('../middlewares/ann');

const router = express.Router();

router.get('/summary', verifierToken, async (req, res) => {
  try {
    const [countResult, itemsResult] = await Promise.all([
      db.query(
        `
          SELECT COUNT(*)::int AS unread_count
          FROM notification
          WHERE id_utilisateur = $1
            AND est_lue = FALSE
        `,
        [req.user.id]
      ),
      db.query(
        `
          SELECT *
          FROM notification
          WHERE id_utilisateur = $1
          ORDER BY date_envoi DESC
          LIMIT 5
        `,
        [req.user.id]
      ),
    ]);

    return res.json({
      unread_count: countResult.rows[0]?.unread_count || 0,
      items: itemsResult.rows,
    });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/', verifierToken, async (req, res) => {
  const limit = Math.min(50, Math.max(1, Number(req.query.limit || 20)));
  const offset = Math.max(0, Number(req.query.offset || 0));
  const unreadOnly = String(req.query.unreadOnly || 'false') === 'true';

  try {
    const conditions = ['id_utilisateur = $1'];
    const params = [req.user.id];

    if (unreadOnly) {
      conditions.push('est_lue = FALSE');
    }

    const totalResult = await db.query(
      `
        SELECT COUNT(*)::int AS total
        FROM notification
        WHERE ${conditions.join(' AND ')}
      `,
      params
    );

    params.push(limit, offset);
    const result = await db.query(
      `
        SELECT *
        FROM notification
        WHERE ${conditions.join(' AND ')}
        ORDER BY date_envoi DESC
        LIMIT $${params.length - 1}
        OFFSET $${params.length}
      `,
      params
    );

    return res.json({
      items: result.rows,
      total: totalResult.rows[0]?.total || 0,
      offset,
      limit,
      has_more: offset + limit < (totalResult.rows[0]?.total || 0),
    });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.patch('/read-all', verifierToken, async (req, res) => {
  try {
    await db.query(
      `
        UPDATE notification
        SET est_lue = TRUE
        WHERE id_utilisateur = $1
          AND est_lue = FALSE
      `,
      [req.user.id]
    );

    return res.json({ message: 'Toutes les notifications ont ete marquees comme lues.' });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.patch('/:id/read', verifierToken, async (req, res) => {
  try {
    const result = await db.query(
      `
        UPDATE notification
        SET est_lue = TRUE
        WHERE id = $1
          AND id_utilisateur = $2
        RETURNING *
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Notification introuvable.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

module.exports = router;
