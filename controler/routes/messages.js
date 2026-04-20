const express = require('express');
const router = express.Router();
const pool = require('../db');


router.get('/conversations/:id_utilisateur', async (req, res) => {
  const { id_utilisateur } = req.params;
  try {
    const result = await pool.query(
      `SELECT
         c.id                  AS conversation_id,
         c.date_creation,

         -- Interlocuteur (l'autre utilisateur)
         CASE WHEN c.id_utilisateur1 = $1
              THEN c.id_utilisateur2
              ELSE c.id_utilisateur1
         END                   AS id_interlocuteur,

         u.nom                 AS interlocuteur_nom,
         u.prenom              AS interlocuteur_prenom,
         u.photo_profil        AS interlocuteur_photo,

         -- Dernier message
         m_last.contenu        AS dernier_message,
         m_last.date_envoi     AS dernier_message_date,
         m_last.id_expediteur  AS dernier_message_expediteur,

         -- Nb messages non lus par cet utilisateur
         COUNT(m_unread.id)    AS nb_non_lus

       FROM conversation c

       -- Récupérer l'interlocuteur
       JOIN utilisateur u ON u.id = CASE
         WHEN c.id_utilisateur1 = $1 THEN c.id_utilisateur2
         ELSE c.id_utilisateur1
       END

       -- Dernier message (LATERAL)
       LEFT JOIN LATERAL (
         SELECT contenu, date_envoi, id_expediteur
         FROM message
         WHERE id_conversation = c.id
         ORDER BY date_envoi DESC
         LIMIT 1
       ) m_last ON true

       -- Messages non lus
       LEFT JOIN message m_unread
         ON m_unread.id_conversation = c.id
        AND m_unread.est_lu = false
        AND m_unread.id_expediteur != $1

       WHERE c.id_utilisateur1 = $1 OR c.id_utilisateur2 = $1

       GROUP BY c.id, c.date_creation, c.id_utilisateur1, c.id_utilisateur2,
                u.nom, u.prenom, u.photo_profil,
                m_last.contenu, m_last.date_envoi, m_last.id_expediteur

       ORDER BY dernier_message_date DESC NULLS LAST`,
      [id_utilisateur]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[messages] Erreur conversations:', err.message);
    res.status(500).json({ erreur: err.message });
  }
});


router.get('/conversation/:id_conversation', async (req, res) => {
  const { id_conversation } = req.params;
  const { id_lecteur } = req.query;
  try {
    // Marquer comme lus les messages reçus par id_lecteur
    if (id_lecteur) {
      await pool.query(
        `UPDATE message
         SET est_lu = true
         WHERE id_conversation = $1
           AND id_expediteur != $2
           AND est_lu = false`,
        [id_conversation, id_lecteur]
      );
    }

    const result = await pool.query(
      `SELECT
         m.id,
         m.id_conversation,
         m.id_expediteur,
         m.contenu,
         m.date_envoi,
         m.est_lu,
         u.nom       AS expediteur_nom,
         u.prenom    AS expediteur_prenom,
         u.photo_profil AS expediteur_photo
       FROM message m
       JOIN utilisateur u ON u.id = m.id_expediteur
       WHERE m.id_conversation = $1
       ORDER BY m.date_envoi ASC`,
      [id_conversation]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[messages] Erreur messages:', err.message);
    res.status(500).json({ erreur: err.message });
  }
});


router.post('/conversations', async (req, res) => {
  let { id_utilisateur1, id_utilisateur2 } = req.body;

  // Normaliser l'ordre pour respecter la contrainte UNIQUE
  if (id_utilisateur1 > id_utilisateur2) {
    [id_utilisateur1, id_utilisateur2] = [id_utilisateur2, id_utilisateur1];
  }

  try {
    // Chercher si la conversation existe déjà
    const existing = await pool.query(
      `SELECT * FROM conversation
       WHERE id_utilisateur1 = $1 AND id_utilisateur2 = $2`,
      [id_utilisateur1, id_utilisateur2]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const result = await pool.query(
      `INSERT INTO conversation (id_utilisateur1, id_utilisateur2)
       VALUES ($1, $2) RETURNING *`,
      [id_utilisateur1, id_utilisateur2]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('[messages] Erreur création conversation:', err.message);
    res.status(500).json({ erreur: err.message });
  }
});


router.post('/', async (req, res) => {
  const { id_conversation, id_expediteur, contenu } = req.body;

  if (!id_conversation || !id_expediteur || !contenu?.trim()) {
    return res.status(400).json({ erreur: 'Champs manquants : id_conversation, id_expediteur, contenu' });
  }

  try {
    // Vérifier que l'expéditeur fait partie de la conversation
    const check = await pool.query(
      `SELECT id FROM conversation
       WHERE id = $1
         AND (id_utilisateur1 = $2 OR id_utilisateur2 = $2)`,
      [id_conversation, id_expediteur]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ erreur: 'Accès non autorisé à cette conversation' });
    }

    const result = await pool.query(
      `INSERT INTO message (id_conversation, id_expediteur, contenu)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id_conversation, id_expediteur, contenu.trim()]
    );

    // Retourner le message avec les infos de l'expéditeur
    const msgFull = await pool.query(
      `SELECT m.*, u.nom AS expediteur_nom, u.prenom AS expediteur_prenom,
              u.photo_profil AS expediteur_photo
       FROM message m
       JOIN utilisateur u ON u.id = m.id_expediteur
       WHERE m.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json(msgFull.rows[0]);
  } catch (err) {
    console.error('[messages] Erreur envoi message:', err.message);
    res.status(500).json({ erreur: err.message });
  }
});


router.patch('/:id/lu', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE message SET est_lu = true WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ erreur: 'Message non trouvé' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});


router.delete('/conversation/:id_conversation', async (req, res) => {
  try {
    await pool.query('DELETE FROM conversation WHERE id = $1', [req.params.id_conversation]);
    res.json({ message: 'Conversation supprimée ✅' });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;
