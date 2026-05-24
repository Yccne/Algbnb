import { get, patch, post } from '../apiClient.js';
import { mapReservation } from './_shared.js';

export const getReservationsVoyageur = async (id) => {
  const data = await get(id ? `/reservations/voyageur/${id}` : '/reservations/me');
  return data.map(mapReservation);
};

export const getReservationsHote = async () => {
  const data = await get('/reservations/host/me');
  return data.map(mapReservation);
};

export const creerReservation = async (reservationData) => {
  const data = await post('/reservations', reservationData);
  return mapReservation(data);
};

export const reserver = creerReservation;

export const annulerReservation = async (id, motif_annulation) => {
  const data = await patch(`/reservations/${id}/annuler`, { motif_annulation });
  return mapReservation(data);
};

export const updateReservationStatus = async (id, statut) => {
  const data = await patch(`/reservations/${id}/statut`, { statut });
  return mapReservation(data);
};

export const ouvrirLitige = async (id, message) => post(`/reservations/${id}/litige`, { message });
