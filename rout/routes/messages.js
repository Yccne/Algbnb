const express = require('express');
const db = require('../db');
const { verifierToken } = require('../middlewares/ann');
const { messageUpload } = require('../middlewares/upload');
const { insertNotification, queueUserMail } = require('../utils/notifications');

const router = express.Router();

const normalizeConversationUsers = (userIdA, userIdB) =>
  Number(userIdA) < Number(userIdB) ? [Number(userIdA), Number(userIdB)] : [Number(userIdB), Number(userIdA)];

const ensureConversationMember = async (conversationId, userId) => {
  const result = await db.query(
    `
      SELECT *
      FROM conversation
      WHERE id = $1
        AND (id_utilisateur1 = $2 OR id_utilisateur2 = $2)
      LIMIT 1
    `,
    [conversationId, userId]
  );
  return result.rows[0] || null;
};

const getRecipientId = (conversation, currentUserId) =>
  String(conversation.id_utilisateur1) === String(currentUserId)
    ? conversation.id_utilisateur2
    : conversation.id_utilisateur1;

const getUserById = async (userId) => {
  const result = await db.query(
    `
      SELECT id, nom, prenom, email
      FROM utilisateur
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );
  return result.rows[0] || null;
};

const fetchConversations = async (userId) =>
  db.query(
    `
      SELECT
        c.id AS conversation_id,
        c.date_creation,
        c.date_mise_a_jour,
        CASE WHEN c.id_utilisateur1 = $1 THEN c.id_utilisateur2 ELSE c.id_utilisateur1 END AS id_interlocuteur,
        u.nom AS interlocuteur_nom,
        u.prenom AS interlocuteur_prenom,
        u.photo_profil AS interlocuteur_photo,
        last_message.contenu AS dernier_message,
        last_message.photo_url AS derniere_photo,
        last_message.date_envoi AS dernier_message_date,
        COUNT(m_unread.id) AS nb_non_lus
      FROM conversation c
      JOIN utilisateur u
        ON u.id = CASE WHEN c.id_utilisateur1 = $1 THEN c.id_utilisateur2 ELSE c.id_utilisateur1 END
      LEFT JOIN LATERAL (
        SELECT contenu, photo_url, date_envoi
        FROM message
        WHERE id_conversation = c.id
        ORDER BY date_envoi DESC
        LIMIT 1
      ) last_message ON TRUE
      LEFT JOIN message m_unread
        ON m_unread.id_conversation = c.id
       AND m_unread.est_lu = FALSE
       AND m_unread.id_expediteur <> $1
      WHERE c.id_utilisateur1 = $1 OR c.id_utilisateur2 = $1
      GROUP BY c.id, u.id, last_message.contenu, last_message.photo_url, last_message.date_envoi
      ORDER BY COALESCE(last_message.date_envoi, c.date_creation) DESC
    `,
    [userId]
  );

const sendMessageNotification = async ({ conversation, currentUser, currentUserId, messageId, isPhotoOnly }) => {
  const recipientId = getRecipientId(conversation, currentUserId);
  const recipient = await getUserById(recipientId);
  if (!recipient) {
    return;
  }

  const senderName = [currentUser.prenom, currentUser.nom].filter(Boolean).join(' ') || 'Un utilisateur';
  const contenu = isPhotoOnly
    ? `${senderName} vous a envoye une photo.`
    : `${senderName} vous a envoye un nouveau message.`;

  await insertNotification(db, recipient.id, 'message', contenu, {
    conversationId: conversation.id,
    fromUserId: currentUserId,
    messageId,
  });

  const emailJobs = [];
  queueUserMail(
    emailJobs,
    recipient,
    `Nouveau message de ${senderName}`,
    isPhotoOnly
      ? `${senderName} vous a envoye une photo dans votre messagerie.`
      : `${senderName} vous a envoye un nouveau message dans votre messagerie.`
  );
  await Promise.allSettled(emailJobs);
};

router.get('/conversations', verifierToken, async (req, res) => {
  try {
    const result = await fetchConversations(req.user.id);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/conversations/:id_utilisateur', verifierToken, async (req, res) => {
  if (String(req.user.id) !== String(req.params.id_utilisateur) && req.user.role !== 'admin') {
    return res.status(403).json({ erreur: 'Acces refuse.' });
  }

  try {
    const result = await fetchConversations(Number(req.params.id_utilisateur));
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/conversation/:id_conversation', verifierToken, async (req, res) => {
  try {
    const conversation = await ensureConversationMember(req.params.id_conversation, req.user.id);
    if (!conversation) {
      return res.status(403).json({ erreur: 'Conversation introuvable ou acces refuse.' });
    }

    await db.query(
      `
        UPDATE message
        SET est_lu = TRUE
        WHERE id_conversation = $1
          AND id_expediteur <> $2
          AND est_lu = FALSE
      `,
      [req.params.id_conversation, req.user.id]
    );

    const result = await db.query(
      `
        SELECT
          m.*,
          u.nom AS expediteur_nom,
          u.prenom AS expediteur_prenom,
          u.photo_profil AS expediteur_photo
        FROM message m
        JOIN utilisateur u ON u.id = m.id_expediteur
        WHERE m.id_conversation = $1
        ORDER BY m.date_envoi ASC
      `,
      [req.params.id_conversation]
    );

    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.post('/conversations', verifierToken, async (req, res) => {
  const interlocuteurId = req.body.interlocuteur_id || req.body.id_utilisateur2;
  if (!interlocuteurId) {
    return res.status(400).json({ erreur: 'interlocuteur_id est requis.' });
  }

  const [user1, user2] = normalizeConversationUsers(req.user.id, interlocuteurId);
  try {
    const existing = await db.query(
      'SELECT * FROM conversation WHERE id_utilisateur1 = $1 AND id_utilisateur2 = $2 LIMIT 1',
      [user1, user2]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const result = await db.query(
      `
        INSERT INTO conversation (id_utilisateur1, id_utilisateur2)
        VALUES ($1, $2)
        RETURNING *
      `,
      [user1, user2]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.post('/', verifierToken, async (req, res) => {
  const { id_conversation, contenu, photo_url } = req.body;
  const trimmedContent = String(contenu || '').trim();
  const trimmedPhotoUrl = String(photo_url || '').trim();

  if (!id_conversation || (!trimmedContent && !trimmedPhotoUrl)) {
    return res.status(400).json({ erreur: 'Conversation et contenu ou photo sont requis.' });
  }

  try {
    const conversation = await ensureConversationMember(id_conversation, req.user.id);
    if (!conversation) {
      return res.status(403).json({ erreur: 'Conversation introuvable ou acces refuse.' });
    }

    const result = await db.query(
      `
        INSERT INTO message (id_conversation, id_expediteur, contenu, photo_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [id_conversation, req.user.id, trimmedContent || null, trimmedPhotoUrl || null]
    );

    await db.query('UPDATE conversation SET date_mise_a_jour = NOW() WHERE id = $1', [id_conversation]);
    await sendMessageNotification({
      conversation,
      currentUser: req.user,
      currentUserId: req.user.id,
      messageId: result.rows[0].id,
      isPhotoOnly: !trimmedContent,
    });
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.post('/photo', verifierToken, messageUpload.single('photo'), async (req, res) => {
  const { id_conversation, contenu } = req.body;
  if (!id_conversation || !req.file) {
    return res.status(400).json({ erreur: 'Conversation et photo sont requises.' });
  }

  try {
    const conversation = await ensureConversationMember(id_conversation, req.user.id);
    if (!conversation) {
      return res.status(403).json({ erreur: 'Conversation introuvable ou acces refuse.' });
    }

    const result = await db.query(
      `
        INSERT INTO message (id_conversation, id_expediteur, contenu, photo_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [id_conversation, req.user.id, contenu || null, `/uploads/messages/${req.file.filename}`]
    );

    await db.query('UPDATE conversation SET date_mise_a_jour = NOW() WHERE id = $1', [id_conversation]);
    await sendMessageNotification({
      conversation,
      currentUser: req.user,
      currentUserId: req.user.id,
      messageId: result.rows[0].id,
      isPhotoOnly: !String(contenu || '').trim(),
    });
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.patch('/:id/lu', verifierToken, async (req, res) => {
  try {
    const result = await db.query(
      `
        UPDATE message m
        SET est_lu = TRUE
        FROM conversation c
        WHERE m.id = $1
          AND c.id = m.id_conversation
          AND (c.id_utilisateur1 = $2 OR c.id_utilisateur2 = $2)
        RETURNING m.*
      `,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Message introuvable.' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.delete('/conversation/:id_conversation', verifierToken, async (req, res) => {
  try {
    const conversation = await ensureConversationMember(req.params.id_conversation, req.user.id);
    if (!conversation) {
      return res.status(403).json({ erreur: 'Conversation introuvable ou acces refuse.' });
    }

    await db.query('DELETE FROM conversation WHERE id = $1', [req.params.id_conversation]);
    return res.json({ message: 'Conversation supprimee.' });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

module.exports = router;
