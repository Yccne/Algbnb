const bcrypt = require('bcryptjs');
const authRepository = require('../repositories/auth.repository');
const {
  validateForgotPasswordPayload,
  validateGooglePayload,
  validateLoginPayload,
  validateRegisterPayload,
  validateResetPasswordPayload,
  validateSocialPayload,
} = require('../validators/auth.validator');
const { conflict, forbidden, notFound, unauthorized, unavailable, badRequest } = require('../utils/httpError');
const { signToken, sanitizeUser, hashToken, generateResetToken } = require('../utils/auth');
const { firebaseAdmin, getFirebaseProviderStatus } = require('../config/firebase.config');

const createAuthResponse = (user) => ({
  token: signToken(user),
  user: sanitizeUser(user),
});

const providerLabels = {
  google: 'Google',
};

const firebaseProviderIds = {
  google: 'google.com',
};

const splitDisplayName = (name, email) => {
  const fallback = email?.split('@')[0] || 'Utilisateur';
  const parts = String(name || fallback).split(/\s+/).filter(Boolean);
  return {
    prenom: parts[0] || 'Utilisateur',
    nom: parts.slice(1).join(' ') || parts[0] || 'Utilisateur',
  };
};

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

const loginWithFirebaseProvider = async (provider, payload) => {
  const { idToken, roleType } = validateSocialPayload(payload, provider);
  const providerLabel = providerLabels[provider];

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
    const message = String(error?.message || '');
    if (/incorrect aud|audience|project|tenant/i.test(message)) {
      throw unauthorized('Configuration Firebase front/backend incoherente. Les cles Firebase client et Admin doivent utiliser le meme projet.');
    }
    throw unauthorized(`Authentification ${providerLabel} invalide.`);
  }

  const signInProvider = decoded.firebase?.sign_in_provider;
  if (signInProvider !== firebaseProviderIds[provider]) {
    throw unauthorized(`Ce token Firebase ne correspond pas a ${providerLabel}.`);
  }

  const providerId = decoded.uid;
  const email = decoded.email ? decoded.email.toLowerCase() : null;
  const { prenom, nom } = splitDisplayName(decoded.name, email);
  const picture = decoded.picture || null;
  let user = await authRepository.findSocialUser({ provider, providerId, email });

  if (!user) {
    if (!email) {
      throw badRequest(`${providerLabel} doit fournir une adresse e-mail pour creer le compte.`);
    }

    user = await authRepository.createSocialUser({
      provider,
      prenom,
      nom,
      email,
      picture,
      roleType,
      providerId,
    });
  } else if (!user.provider_id || user.provider_source !== provider) {
    if (user.provider_source !== 'local' && user.provider_source !== provider) {
      const currentProvider = providerLabels[user.provider_source] || user.provider_source;
      throw conflict(`Ce compte est deja associe a ${currentProvider}.`);
    }

    user = await authRepository.attachSocialProvider({ userId: user.id, provider, providerId, picture });
  }

  if (user.statut_compte !== 'actif') {
    throw forbidden(`Compte ${user.statut_compte}.`);
  }

  await authRepository.updateLastLogin(user.id);
  return createAuthResponse(user);
};

const loginWithGoogle = (payload) => {
  validateGooglePayload(payload);
  return loginWithFirebaseProvider('google', payload);
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

const getMe = async (currentUser) => {
  const userId = currentUser.id || currentUser;
  const user = await authRepository.findUserById(userId);
  if (!user) {
    throw notFound('Utilisateur introuvable.');
  }
  const impersonation = currentUser.impersonatedByAdminId
    ? {
        active: true,
        adminId: currentUser.impersonatedByAdminId,
        originalAdminId: currentUser.originalAdminId || currentUser.impersonatedByAdminId,
      }
    : null;
  return { user: sanitizeUser(user, { impersonation }) };
};

module.exports = {
  forgotPassword,
  getMe,
  getProviders: getFirebaseProviderStatus,
  login,
  loginWithFirebaseProvider,
  loginWithGoogle,
  register,
  resetPassword,
};
