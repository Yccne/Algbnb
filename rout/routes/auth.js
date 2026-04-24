const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { verifierToken } = require('../middlewares/ann');
const { signToken, sanitizeUser, hashToken, generateResetToken } = require('../utils/auth');

const router = express.Router();

const isUniqueViolation = (error) => error.code === '23505';

const getLoginField = ({ identifier, email, telephone }) => {
  if (identifier) {
    return identifier.includes('@')
      ? { field: 'email', value: identifier.toLowerCase() }
      : { field: 'telephone', value: identifier };
  }

  if (email) return { field: 'email', value: email.toLowerCase() };
  if (telephone) return { field: 'telephone', value: telephone };
  return null;
};

const registerHandler = async (req, res) => {
  const {
    nom,
    prenom,
    email,
    telephone,
    mot_de_passe,
    password,
    role_type = 'voyageur',
  } = req.body;

  if (!nom || !prenom || !(email || telephone) || !(mot_de_passe || password)) {
    return res.status(400).json({ erreur: 'Nom, prénom, contact et mot de passe sont obligatoires.' });
  }

  if (!['voyageur', 'hote'].includes(role_type)) {
    return res.status(400).json({ erreur: 'Le rôle doit être voyageur ou hote.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(mot_de_passe || password, 10);
    const result = await db.query(
      `
        INSERT INTO utilisateur (
          nom, prenom, email, telephone, mot_de_passe, role_type, provider_source
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'local')
        RETURNING *
      `,
      [nom.trim(), prenom.trim(), email ? email.toLowerCase() : null, telephone || null, hashedPassword, role_type]
    );

    const user = result.rows[0];
    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return res.status(409).json({ erreur: 'Un compte existe déjà avec cet e-mail ou ce téléphone.' });
    }
    return res.status(500).json({ erreur: error.message });
  }
};

const loginHandler = async (req, res) => {
  const { mot_de_passe, password } = req.body;
  const loginField = getLoginField(req.body);

  if (!loginField || !(mot_de_passe || password)) {
    return res.status(400).json({ erreur: 'Identifiant et mot de passe requis.' });
  }

  try {
    const result = await db.query(`SELECT * FROM utilisateur WHERE ${loginField.field} = $1 LIMIT 1`, [loginField.value]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    }

    const user = result.rows[0];
    if (!user.mot_de_passe) {
      return res.status(400).json({ erreur: 'Ce compte doit se connecter avec son fournisseur social.' });
    }
    if (user.statut_compte !== 'actif') {
      return res.status(403).json({ erreur: `Compte ${user.statut_compte}.` });
    }

    const valid = await bcrypt.compare(mot_de_passe || password, user.mot_de_passe);
    if (!valid) {
      return res.status(401).json({ erreur: 'Mot de passe incorrect.' });
    }

    await db.query('UPDATE utilisateur SET derniere_connexion = NOW() WHERE id = $1', [user.id]);
    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
};

router.post('/inscription', registerHandler);
router.post('/register', registerHandler);
router.post('/connexion', loginHandler);
router.post('/login', loginHandler);

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ erreur: 'L’e-mail est obligatoire.' });
  }

  try {
    const userResult = await db.query('SELECT * FROM utilisateur WHERE email = $1 LIMIT 1', [email.toLowerCase()]);
    if (userResult.rows.length === 0) {
      return res.json({ message: 'Si cet e-mail existe, un lien de réinitialisation a été généré.' });
    }

    const user = userResult.rows[0];
    const rawToken = generateResetToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await db.query('DELETE FROM password_reset_token WHERE id_utilisateur = $1', [user.id]);
    await db.query(
      `
        INSERT INTO password_reset_token (id_utilisateur, token_hash, expires_at)
        VALUES ($1, $2, $3)
      `,
      [user.id, tokenHash, expiresAt]
    );

    const clientUrl = (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
    const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
    return res.json({
      message: 'Lien de réinitialisation généré pour le mode local.',
      reset_token: rawToken,
      reset_url: resetUrl,
      expires_at: expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, mot_de_passe, password } = req.body;
  if (!token || !(mot_de_passe || password)) {
    return res.status(400).json({ erreur: 'Token et nouveau mot de passe requis.' });
  }

  try {
    const tokenHash = hashToken(token);
    const result = await db.query(
      `
        SELECT * FROM password_reset_token
        WHERE token_hash = $1
          AND used_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ erreur: 'Token invalide ou expiré.' });
    }

    const resetRow = result.rows[0];
    const hashedPassword = await bcrypt.hash(mot_de_passe || password, 10);

    await db.query('UPDATE utilisateur SET mot_de_passe = $1, provider_source = $2, date_mise_a_jour = NOW() WHERE id = $3', [
      hashedPassword,
      'local',
      resetRow.id_utilisateur,
    ]);
    await db.query('UPDATE password_reset_token SET used_at = NOW() WHERE id = $1', [resetRow.id]);

    return res.json({ message: 'Mot de passe mis à jour.' });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/me', verifierToken, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM utilisateur WHERE id = $1 LIMIT 1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    }
    return res.json({ user: sanitizeUser(result.rows[0]) });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/providers', (req, res) => {
  res.json({
    google: Boolean(process.env.GOOGLE_CLIENT_ID),
    facebook: Boolean(process.env.FACEBOOK_CLIENT_ID),
    note: 'Les connexions sociales nécessitent des clés OAuth à fournir.',
  });
});

module.exports = router;
