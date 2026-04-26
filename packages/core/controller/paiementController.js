import { post, get } from '../apiClient.js';

export const payerParDahabiya = async (reservationId, carteData) => {
  return post(`/paiements/reservation/${reservationId}`, carteData);
};

export const getPaiementReservation = async (reservationId) => {
  return get(`/paiements/reservation/${reservationId}`);
};