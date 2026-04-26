import { get, patch } from '../apiClient.js';
import { mapUser } from './_shared.js';

export const getMyProfile = async () => {
  const data = await get('/users/me');
  return {
    user: mapUser(data.user),
    stats: data.stats || {},
  };
};

export const updateMyProfile = async (payload) => {
  const data = await patch('/users/me', payload);
  return mapUser(data.user);
};

export const getPublicProfile = async (id) => {
  const data = await get(`/users/${id}/public`);
  return mapUser(data);
};
