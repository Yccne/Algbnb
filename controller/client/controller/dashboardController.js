import { get } from '../apiClient.js';
import { mapListing, mapNotification, mapReservation } from './_shared.js';

export const getHostDashboard = async () => {
  const data = await get('/dashboard/host/me');
  return {
    ...data,
    logements: (data.logements || []).map(mapListing),
    reservations: (data.reservations || []).map(mapReservation),
    notifications: (data.notifications || []).map(mapNotification),
  };
};
