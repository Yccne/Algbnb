import { get, patch, post } from '../apiClient.js';
import { mapExchange, mapUser } from './_shared.js';

export const getAdminStats = async () => get('/admin/stats');

export const getAdminUsers = async (params) => get('/admin/users', params);
export const updateAdminUserStatus = async (id, statut_compte, note) =>
  patch(`/admin/users/${id}/status`, { statut_compte, note });
export const updateAdminUserVerification = async (id, est_verifie, note) =>
  patch(`/admin/users/${id}/verification`, { est_verifie, note });
export const startAdminImpersonation = async (id) => {
  const data = await post(`/admin/users/${id}/impersonation`);
  return { ...data, user: mapUser(data.user) };
};
export const endAdminImpersonation = async (userId) => post('/admin/impersonation/end', { userId });

export const getAdminListings = async (params) => get('/admin/annonces', params);
export const updateAdminListingValidation = async (id, validation_statut, note) =>
  patch(`/admin/annonces/${id}/validation`, { validation_statut, note });
export const updateAdminListingPublication = async (id, est_actif, note) =>
  patch(`/admin/annonces/${id}/publication`, { est_actif, note });

export const getAdminReservations = async (params) => get('/admin/reservations', params);
export const updateAdminReservationStatus = async (id, statut, note, motif_annulation) =>
  patch(`/admin/reservations/${id}/status`, { statut, note, motif_annulation });

export const getAdminConversations = async (params) => get('/admin/conversations', params);
export const getAdminConversationMessages = async (id) => get(`/admin/conversations/${id}/messages`);
export const updateAdminMessageVisibility = async (id, est_visible, note) =>
  patch(`/admin/messages/${id}/visibility`, { est_visible, note });

export const getAdminReviews = async (params) => get('/admin/avis', params);
export const updateAdminReviewVisibility = async (id, est_visible, note) =>
  patch(`/admin/avis/${id}/visibility`, { est_visible, note });

export const getAdminDisputes = async (params) => get('/admin/litiges', params);
export const getAdminExchanges = async (params) => {
  const data = await get('/admin/echanges', params);
  return data.map(mapExchange);
};
export const createAdminDispute = async (payload) => post('/admin/litiges', payload);
export const updateAdminDispute = async (id, payload) => patch(`/admin/litiges/${id}`, payload);

export const getAdminActions = async (params) => get('/admin/actions', params);
