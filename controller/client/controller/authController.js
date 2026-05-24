import { get, patch, post } from '../apiClient.js';
import { storage } from '../storage.js';
import { mapUser } from './_shared.js';

const ORIGINAL_ADMIN_TOKEN_KEY = 'original_admin_token';
const ORIGINAL_ADMIN_USER_KEY = 'original_admin_user';
const IMPERSONATED_USER_ID_KEY = 'impersonated_user_id';

const saveSession = ({ token, user }) => {
  if (token) storage.setItem('token', token);
  if (user) storage.setItem('user', JSON.stringify(user));
};

export const login = async (identifierOrEmail, password) => {
  const payload =
    typeof identifierOrEmail === 'object'
      ? identifierOrEmail
      : { identifier: identifierOrEmail, mot_de_passe: password };

  const data = await post('/auth/connexion', payload);
  const user = mapUser(data.user);
  saveSession({ token: data.token, user });
  return user;
};

export const register = async (userData) => {
  const data = await post('/auth/inscription', userData);
  const user = mapUser(data.user);
  saveSession({ token: data.token, user });
  return user;
};

export const loginWithSocial = async (provider, idToken, role = 'voyageur') => {
  const data = await post(`/auth/${provider}`, { idToken, role_type: role });
  const user = mapUser(data.user);
  saveSession({ token: data.token, user });
  return user;
};

export const loginWithGoogle = (idToken, role = 'voyageur') => loginWithSocial('google', idToken, role);

export const logout = async () => {
  storage.removeItem('token');
  storage.removeItem('user');
  storage.removeItem(ORIGINAL_ADMIN_TOKEN_KEY);
  storage.removeItem(ORIGINAL_ADMIN_USER_KEY);
  storage.removeItem(IMPERSONATED_USER_ID_KEY);
  return true;
};

export const getCurrentUser = () => {
  const saved = storage.getItem('user');
  if (!saved) return null;
  try {
    return mapUser(JSON.parse(saved));
  } catch (error) {
    return null;
  }
};

export const getToken = () => storage.getItem('token');

export const startImpersonationSession = ({ adminToken, adminUser, token, user, targetUserId }) => {
  if (adminToken) storage.setItem(ORIGINAL_ADMIN_TOKEN_KEY, adminToken);
  if (adminUser) storage.setItem(ORIGINAL_ADMIN_USER_KEY, JSON.stringify(adminUser));
  if (targetUserId) storage.setItem(IMPERSONATED_USER_ID_KEY, String(targetUserId));
  saveSession({ token, user });
  return mapUser(user);
};

export const restoreAdminSession = () => {
  const adminToken = storage.getItem(ORIGINAL_ADMIN_TOKEN_KEY);
  const adminUserRaw = storage.getItem(ORIGINAL_ADMIN_USER_KEY);
  const targetUserId = storage.getItem(IMPERSONATED_USER_ID_KEY);
  if (!adminToken || !adminUserRaw) return null;

  let adminUser = null;
  try {
    adminUser = mapUser(JSON.parse(adminUserRaw));
  } catch {
    adminUser = null;
  }

  storage.setItem('token', adminToken);
  if (adminUser) storage.setItem('user', JSON.stringify(adminUser));
  storage.removeItem(ORIGINAL_ADMIN_TOKEN_KEY);
  storage.removeItem(ORIGINAL_ADMIN_USER_KEY);
  storage.removeItem(IMPERSONATED_USER_ID_KEY);
  return { user: adminUser, targetUserId };
};

export const fetchCurrentUser = async () => {
  const data = await get('/auth/me');
  const user = mapUser(data.user);
  storage.setItem('user', JSON.stringify(user));
  return user;
};

export const updateProfile = async (payload) => {
  const data = await patch('/users/me', payload);
  const user = mapUser(data.user);
  storage.setItem('user', JSON.stringify(user));
  return user;
};

export const uploadProfilePhoto = async (file) => {
  const formData = new FormData();
  formData.append('photo', file);
  const data = await post('/users/me/photo', formData);
  const user = mapUser(data.user);
  storage.setItem('user', JSON.stringify(user));
  return user;
};

export const forgotPassword = async (email) => post('/auth/forgot-password', { email });
export const resetPassword = async (token, mot_de_passe) => post('/auth/reset-password', { token, mot_de_passe });
export const getAuthProviders = () => get('/auth/providers');
