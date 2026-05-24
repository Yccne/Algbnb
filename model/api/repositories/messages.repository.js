const database = require('./database.repository');

const normalizeConversationUsers = (userIdA, userIdB) =>
  Number(userIdA) < Number(userIdB) ? [Number(userIdA), Number(userIdB)] : [Number(userIdB), Number(userIdA)];

const findConversationMember = async ({ conversationId, userId }) => {
  const result = await database.query(
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

const findUserById = async (userId) => {
  const result = await database.query(
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

const listConversations = async (userId) => {
  const result = await database.query(
    `
      SELECT
        c.id AS conversation_id,
        c.date_creation,
        c.date_mise_a_jour,
        CASE WHEN c.id_utilisateur1 = $1 THEN c.id_utilisateur2 ELSE c.id_utilisateur1 END AS id_interlocuteur,
        u.nom AS interlocuteur_nom,
        u.prenom AS interlocuteur_prenom,
        u.photo_profil AS interlocuteur_photo,
        CASE
          WHEN last_message.id IS NULL THEN NULL
          WHEN last_message.est_visible = TRUE THEN last_message.contenu
          ELSE '[Message masque par la moderation]'
        END AS dernier_message,
        CASE WHEN last_message.est_visible = TRUE THEN last_message.photo_url ELSE NULL END AS derniere_photo,
        last_message.date_envoi AS dernier_message_date,
        COUNT(m_unread.id) AS nb_non_lus
      FROM conversation c
      JOIN utilisateur u
        ON u.id = CASE WHEN c.id_utilisateur1 = $1 THEN c.id_utilisateur2 ELSE c.id_utilisateur1 END
      LEFT JOIN LATERAL (
        SELECT id, contenu, photo_url, date_envoi, est_visible
        FROM message
        WHERE id_conversation = c.id
        ORDER BY date_envoi DESC
        LIMIT 1
      ) last_message ON TRUE
      LEFT JOIN message m_unread
        ON m_unread.id_conversation = c.id
       AND m_unread.est_lu = FALSE
       AND m_unread.est_visible = TRUE
       AND m_unread.id_expediteur <> $1
      WHERE c.id_utilisateur1 = $1 OR c.id_utilisateur2 = $1
      GROUP BY c.id, u.id, last_message.id, last_message.contenu, last_message.photo_url, last_message.date_envoi, last_message.est_visible
      ORDER BY COALESCE(last_message.date_envoi, c.date_creation) DESC
    `,
    [userId]
  );
  return result.rows;
};

const markConversationRead = async ({ conversationId, userId }) => {
  await database.query(
    `
      UPDATE message
      SET est_lu = TRUE
      WHERE id_conversation = $1
        AND id_expediteur <> $2
        AND est_lu = FALSE
    `,
    [conversationId, userId]
  );
};

const listMessages = async (conversationId) => {
  const result = await database.query(
    `
      SELECT
        m.id,
        m.id_conversation,
        m.id_expediteur,
        CASE
          WHEN m.est_visible = TRUE THEN m.contenu
          ELSE '[Message masque par la moderation]'
        END AS contenu,
        CASE WHEN m.est_visible = TRUE THEN m.photo_url ELSE NULL END AS photo_url,
        m.date_envoi,
        m.est_lu,
        m.est_visible,
        u.nom AS expediteur_nom,
        u.prenom AS expediteur_prenom,
        u.photo_profil AS expediteur_photo
      FROM message m
      JOIN utilisateur u ON u.id = m.id_expediteur
      WHERE m.id_conversation = $1
      ORDER BY m.date_envoi ASC
    `,
    [conversationId]
  );
  return result.rows;
};

const updateVisibility = async ({ messageId, visible, moderatorId, note }) => {
  const result = await database.query(
    `
      UPDATE message
      SET est_visible = $1,
          moderation_note = $2,
          id_moderateur = $3,
          date_moderation = NOW()
      WHERE id = $4
      RETURNING *
    `,
    [visible, note || null, moderatorId || null, messageId]
  );
  return result.rows[0] || null;
};

const findConversationByUsers = async ({ user1, user2 }) => {
  const result = await database.query(
    'SELECT * FROM conversation WHERE id_utilisateur1 = $1 AND id_utilisateur2 = $2 LIMIT 1',
    [user1, user2]
  );
  return result.rows[0] || null;
};

const createConversation = async ({ user1, user2 }) => {
  const result = await database.query(
    `
      INSERT INTO conversation (id_utilisateur1, id_utilisateur2)
      VALUES ($1, $2)
      RETURNING *
    `,
    [user1, user2]
  );
  return result.rows[0];
};

const createMessage = async ({ conversationId, senderId, content, photoUrl }) =>
  database.withTransaction(async (client) => {
    const result = await client.query(
      `
        INSERT INTO message (id_conversation, id_expediteur, contenu, photo_url)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [conversationId, senderId, content, photoUrl]
    );

    await client.query('UPDATE conversation SET date_mise_a_jour = NOW() WHERE id = $1', [conversationId]);
    return result.rows[0];
  });

const markMessageRead = async ({ messageId, userId }) => {
  const result = await database.query(
    `
      UPDATE message m
      SET est_lu = TRUE
      FROM conversation c
      WHERE m.id = $1
        AND c.id = m.id_conversation
        AND (c.id_utilisateur1 = $2 OR c.id_utilisateur2 = $2)
      RETURNING m.*
    `,
    [messageId, userId]
  );
  return result.rows[0] || null;
};

const deleteConversation = async (conversationId) => {
  await database.query('DELETE FROM conversation WHERE id = $1', [conversationId]);
};

module.exports = {
  createConversation,
  createMessage,
  deleteConversation,
  findConversationByUsers,
  findConversationMember,
  findUserById,
  listConversations,
  listMessages,
  markConversationRead,
  markMessageRead,
  normalizeConversationUsers,
  updateVisibility,
};
