const { badRequest } = require('../utils/httpError');

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

const validateRole = (roleType) => {
  if (!['voyageur', 'hote'].includes(roleType)) {
    throw badRequest('Le role doit etre voyageur ou hote.');
  }
};

const validateSocialProvider = (provider) => {
  if (!['google', 'facebook'].includes(provider)) {
    throw badRequest('Fournisseur social non supporte.');
  }
};

const validateRegisterPayload = (payload) => {
  const roleType = payload.role_type || 'voyageur';
  if (!payload.nom || !payload.prenom || !(payload.email || payload.telephone) || !(payload.mot_de_passe || payload.password)) {
    throw badRequest('Nom, prenom, contact et mot de passe sont obligatoires.');
  }
  validateRole(roleType);

  return {
    nom: payload.nom.trim(),
    prenom: payload.prenom.trim(),
    email: payload.email ? payload.email.toLowerCase() : null,
    telephone: payload.telephone || null,
    password: payload.mot_de_passe || payload.password,
    roleType,
  };
};

const validateLoginPayload = (payload) => {
  const loginField = getLoginField(payload);
  const password = payload.mot_de_passe || payload.password;
  if (!loginField || !password) {
    throw badRequest('Identifiant et mot de passe requis.');
  }

  return { loginField, password };
};

const validateSocialPayload = (payload, provider) => {
  validateSocialProvider(provider);
  const roleType = payload.role_type || 'voyageur';
  if (!payload.idToken) {
    throw badRequest(`Token ${provider === 'facebook' ? 'Facebook' : 'Google'} manquant.`);
  }
  validateRole(roleType);
  return { idToken: payload.idToken, provider, roleType };
};

const validateGooglePayload = (payload) => validateSocialPayload(payload, 'google');

const validateForgotPasswordPayload = ({ email }) => {
  if (!email) {
    throw badRequest("L'e-mail est obligatoire.");
  }
  return email.toLowerCase();
};

const validateResetPasswordPayload = ({ token, mot_de_passe, password }) => {
  const nextPassword = mot_de_passe || password;
  if (!token || !nextPassword) {
    throw badRequest('Token et nouveau mot de passe requis.');
  }
  return { token, password: nextPassword };
};

module.exports = {
  validateForgotPasswordPayload,
  validateGooglePayload,
  validateLoginPayload,
  validateRegisterPayload,
  validateResetPasswordPayload,
  validateSocialPayload,
};
