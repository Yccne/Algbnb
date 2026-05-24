const database = require('./database.repository');

const isUniqueViolation = (error) => error.code === '23505';
const socialProviders = ['google'];

const assertSocialProvider = (provider) => {
  if (!socialProviders.includes(provider)) {
    throw new Error('Unsupported social provider.');
  }
};

const createLocalUser = async ({ nom, prenom, email, telephone, hashedPassword, roleType }) => {
  const result = await database.query(
    `
      INSERT INTO utilisateur (
        nom, prenom, email, telephone, mot_de_passe, role_type, provider_source
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'local')
      RETURNING *
    `,
    [nom, prenom, email, telephone, hashedPassword, roleType]
  );
  return result.rows[0];
};

const findUserByLoginField = async ({ field, value }) => {
  const column = field === 'telephone' ? 'telephone' : 'email';
  const result = await database.query(`SELECT * FROM utilisateur WHERE ${column} = $1 LIMIT 1`, [value]);
  return result.rows[0] || null;
};

const findUserById = async (userId) => {
  const result = await database.query('SELECT * FROM utilisateur WHERE id = $1 LIMIT 1', [userId]);
  return result.rows[0] || null;
};

const updateLastLogin = async (userId) => {
  await database.query('UPDATE utilisateur SET derniere_connexion = NOW() WHERE id = $1', [userId]);
};

const findSocialUser = async ({ provider, providerId, email }) => {
  assertSocialProvider(provider);
  const queryText = email
    ? 'SELECT * FROM utilisateur WHERE (provider_source = $1 AND provider_id = $2) OR email = $3 LIMIT 1'
    : 'SELECT * FROM utilisateur WHERE provider_source = $1 AND provider_id = $2 LIMIT 1';
  const params = email ? [provider, providerId, email] : [provider, providerId];
  const result = await database.query(queryText, params);
  return result.rows[0] || null;
};

const createSocialUser = async ({ provider, prenom, nom, email, picture, roleType, providerId }) => {
  assertSocialProvider(provider);
  const result = await database.query(
    `
      INSERT INTO utilisateur (prenom, nom, email, photo_profil, role_type, provider_source, provider_id, est_verifie)
      VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
      RETURNING *
    `,
    [prenom, nom, email, picture, roleType, provider, providerId]
  );
  return result.rows[0];
};

const attachSocialProvider = async ({ userId, provider, providerId, picture }) => {
  assertSocialProvider(provider);
  const result = await database.query(
    `
      UPDATE utilisateur
      SET provider_id = $1,
          provider_source = $2,
          est_verifie = TRUE,
          photo_profil = COALESCE($3, photo_profil),
          date_mise_a_jour = NOW()
      WHERE id = $4
      RETURNING *
    `,
    [providerId, provider, picture, userId]
  );
  return result.rows[0];
};

const findGoogleUser = ({ providerId, email }) => findSocialUser({ provider: 'google', providerId, email });

const createGoogleUser = (payload) => createSocialUser({ provider: 'google', ...payload });

const attachGoogleProvider = (payload) => attachSocialProvider({ provider: 'google', ...payload });

const findUserByEmail = async (email) => {
  const result = await database.query('SELECT * FROM utilisateur WHERE email = $1 LIMIT 1', [email]);
  return result.rows[0] || null;
};

const deleteResetTokensForUser = async (userId) => {
  await database.query('DELETE FROM password_reset_token WHERE id_utilisateur = $1', [userId]);
};

const createResetToken = async ({ userId, tokenHash, expiresAt }) => {
  await database.query(
    `
      INSERT INTO password_reset_token (id_utilisateur, token_hash, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, tokenHash, expiresAt]
  );
};

const findValidResetToken = async (tokenHash) => {
  const result = await database.query(
    `
      SELECT *
      FROM password_reset_token
      WHERE token_hash = $1
        AND used_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [tokenHash]
  );
  return result.rows[0] || null;
};

const updatePasswordFromReset = async ({ userId, resetTokenId, hashedPassword }) => {
  await database.withTransaction(async (client) => {
    await client.query(
      'UPDATE utilisateur SET mot_de_passe = $1, provider_source = $2, date_mise_a_jour = NOW() WHERE id = $3',
      [hashedPassword, 'local', userId]
    );
    await client.query('UPDATE password_reset_token SET used_at = NOW() WHERE id = $1', [resetTokenId]);
  });
};

module.exports = {
  attachGoogleProvider,
  attachSocialProvider,
  createGoogleUser,
  createLocalUser,
  createResetToken,
  createSocialUser,
  deleteResetTokensForUser,
  findGoogleUser,
  findSocialUser,
  findUserByEmail,
  findUserById,
  findUserByLoginField,
  findValidResetToken,
  isUniqueViolation,
  updateLastLogin,
  updatePasswordFromReset,
};
