import { get, patch } from '../apiClient.js';

export const getAdminStats = async () => get('/admin/stats');
export const getAdminUsers = async () => get('/admin/users');
export const updateAdminUserStatus = async (id, statut_compte) =>
  patch(`/admin/users/${id}/status`, { statut_compte });
export const getAdminListings = async () => get('/admin/annonces');
export const updateAdminListingValidation = async (id, validation_statut) =>
  patch(`/admin/annonces/${id}/validation`, { validation_statut });
export const getAdminDisputes = async () => get('/admin/litiges');
