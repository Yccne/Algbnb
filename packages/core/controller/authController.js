import { get, patch, post } from '../apiClient.js';
import { storage } from '../storage.js';
import { mapUser } from './_shared.js';

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

export const logout = async () => {
  storage.removeItem('token');
  storage.removeItem('user');
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
