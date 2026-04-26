const bcrypt = require('bcryptjs');
const authRepository = require('../repositories/auth.repository');
const {
  validateForgotPasswordPayload,
  validateGooglePayload,
  validateLoginPayload,
  validateRegisterPayload,
  validateResetPasswordPayload,
} = require('../validators/auth.validator');
const { conflict, forbidden, notFound, unauthorized, unavailable, badRequest } = require('../utils/httpError');
const { signToken, sanitizeUser, hashToken, generateResetToken } = require('../utils/auth');
const { firebaseAdmin, getFirebaseProviderStatus } = require('../config/firebase.config');

const createAuthResponse = (user) => ({
  token: signToken(user),
  user: sanitizeUser(user),
});

const register = async (payload) => {
  const data = validateRegisterPayload(payload);
  try {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await authRepository.createLocalUser({ ...data, hashedPassword });
    return createAuthResponse(user);
  } catch (error) {
    if (authRepository.isUniqueViolation(error)) {
      throw conflict('Un compte existe deja avec cet e-mail ou ce telephone.');
    }
    throw error;
  }
};

const login = async (payload) => {
  const { loginField, password } = validateLoginPayload(payload);
  const user = await authRepository.findUserByLoginField(loginField);
  if (!user) {
    throw notFound('Utilisateur introuvable.');
  }
  if (!user.mot_de_passe) {
    throw badRequest('Ce compte doit se connecter avec son fournisseur social.');
  }
  if (user.statut_compte !== 'actif') {
    throw forbidden(`Compte ${user.statut_compte}.`);
  }

  const valid = await bcrypt.compare(password, user.mot_de_passe);
  if (!valid) {
    throw unauthorized('Mot de passe incorrect.');
  }

  await authRepository.updateLastLogin(user.id);
  return createAuthResponse(user);
};

const loginWithGoogle = async (payload) => {
  const { idToken, roleType } = validateGooglePayload(payload);
  if (!firebaseAdmin.isFirebaseAdminConfigured) {
    const missing = firebaseAdmin.missingFirebaseAdminEnvKeys?.length
      ? ` Variables manquantes: ${firebaseAdmin.missingFirebaseAdminEnvKeys.join(', ')}.`
      : '';
    throw unavailable(`Configuration Firebase Admin incomplete.${missing}`);
  }

  let decoded;
  try {
    decoded = await firebaseAdmin.auth().verifyIdToken(idToken);
  } catch (error) {
    throw unauthorized('Authentification Google invalide.');
  }

  const providerId = decoded.uid;
  const email = decoded.email ? decoded.email.toLowerCase() : null;
  const name = decoded.name || '';
  const picture = decoded.picture || null;
  let user = await authRepository.findGoogleUser({ providerId, email });

  if (!user) {
    const parts = name.split(' ').filter(Boolean);
    user = await authRepository.createGoogleUser({
      prenom: parts[0] || 'Utilisateur',
      nom: parts.slice(1).join(' ') || parts[0] || 'Utilisateur',
      email,
      picture,
      roleType,
      providerId,
    });
  } else if (!user.provider_id || user.provider_source !== 'google') {
    user = await authRepository.attachGoogleProvider({ userId: user.id, providerId, picture });
  }

  await authRepository.updateLastLogin(user.id);
  return createAuthResponse(user);
};

const forgotPassword = async (payload, clientBaseUrl) => {
  const email = validateForgotPasswordPayload(payload);
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    return { message: 'Si cet e-mail existe, un lien de reinitialisation a ete genere.' };
  }

  const rawToken = generateResetToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await authRepository.deleteResetTokensForUser(user.id);
  await authRepository.createResetToken({ userId: user.id, tokenHash, expiresAt });

  return {
    message: 'Lien de reinitialisation genere pour le mode local.',
    reset_token: rawToken,
    reset_url: `${clientBaseUrl.replace(/\/$/, '')}/reset-password?token=${rawToken}`,
    expires_at: expiresAt,
  };
};

const resetPassword = async (payload) => {
  const { token, password } = validateResetPasswordPayload(payload);
  const resetRow = await authRepository.findValidResetToken(hashToken(token));
  if (!resetRow) {
    throw badRequest('Token invalide ou expire.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await authRepository.updatePasswordFromReset({
    userId: resetRow.id_utilisateur,
    resetTokenId: resetRow.id,
    hashedPassword,
  });
  return { message: 'Mot de passe mis a jour.' };
};

const getMe = async (userId) => {
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw notFound('Utilisateur introuvable.');
  }
  return { user: sanitizeUser(user) };
};

module.exports = {
  forgotPassword,
  getMe,
  getProviders: getFirebaseProviderStatus,
  login,
  loginWithGoogle,
  register,
  resetPassword,
};
