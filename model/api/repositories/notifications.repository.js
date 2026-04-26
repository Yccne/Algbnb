const database = require('./database.repository');

const insertNotification = async (queryable, userId, type, contenu, meta = null) => {
  const result = await queryable.query(
    `
      INSERT INTO notification (id_utilisateur, type, contenu, meta)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [userId, type, contenu, meta]
  );
  return result.rows[0];
};

const countUnreadByUser = async (userId) => {
  const result = await database.query(
    `
      SELECT COUNT(*)::int AS unread_count
      FROM notification
      WHERE id_utilisateur = $1
        AND est_lue = FALSE
    `,
    [userId]
  );
  return result.rows[0]?.unread_count || 0;
};

const findLatestByUser = async (userId, limit) => {
  const result = await database.query(
    `
      SELECT *
      FROM notification
      WHERE id_utilisateur = $1
      ORDER BY date_envoi DESC
      LIMIT $2
    `,
    [userId, limit]
  );
  return result.rows;
};

const countByUser = async ({ userId, unreadOnly }) => {
  const conditions = ['id_utilisateur = $1'];
  const params = [userId];
  if (unreadOnly) {
    conditions.push('est_lue = FALSE');
  }

  const result = await database.query(
    `
      SELECT COUNT(*)::int AS total
      FROM notification
      WHERE ${conditions.join(' AND ')}
    `,
    params
  );
  return result.rows[0]?.total || 0;
};

const findByUser = async ({ userId, unreadOnly, limit, offset }) => {
  const conditions = ['id_utilisateur = $1'];
  const params = [userId];
  if (unreadOnly) {
    conditions.push('est_lue = FALSE');
  }

  params.push(limit, offset);
  const result = await database.query(
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
  return result.rows;
};

const markAllRead = async (userId) => {
  await database.query(
    `
      UPDATE notification
      SET est_lue = TRUE
      WHERE id_utilisateur = $1
        AND est_lue = FALSE
    `,
    [userId]
  );
};

const markOneRead = async ({ notificationId, userId }) => {
  const result = await database.query(
    `
      UPDATE notification
      SET est_lue = TRUE
      WHERE id = $1
        AND id_utilisateur = $2
      RETURNING *
    `,
    [notificationId, userId]
  );
  return result.rows[0] || null;
};

module.exports = {
  countByUser,
  countUnreadByUser,
  findByUser,
  findLatestByUser,
  insertNotification,
  markAllRead,
  markOneRead,
};
