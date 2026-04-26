import { get, patch } from '../apiClient.js';
import { mapNotification } from './_shared.js';

export const getNotificationSummary = async () => {
  const data = await get('/notifications/summary');
  return {
    ...data,
    items: (data.items || []).map(mapNotification),
  };
};

export const getNotifications = async (params = {}) => {
  const data = await get('/notifications', params);
  return {
    ...data,
    items: (data.items || []).map(mapNotification),
  };
};

export const markNotificationRead = async (id) => {
  const data = await patch(`/notifications/${id}/read`, {});
  return mapNotification(data);
};

export const markAllNotificationsRead = async () => patch('/notifications/read-all', {});
