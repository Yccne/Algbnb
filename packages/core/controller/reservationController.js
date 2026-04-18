<<<<<<< HEAD
const API_URL = 'http://localhost:3001/api';

export const getReservationsVoyageur = async (id) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/reservations/voyageur/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};

export const creerReservation = async (reservationData) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/reservations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(reservationData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};

export const annulerReservation = async (id) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/reservations/${id}/annuler`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};
=======
import { Reservation } from '../model/Reservation.js';
import { getLogementById } from './logementController.js';

const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock database
let reservations = [
  new Reservation({ id: 101, logementId: 1, voyageurId: 2, dateArrivee: '2026-04-10', dateDepart: '2026-04-15', total: 60000, statut: 'confirmée' }),
  new Reservation({ id: 102, logementId: 2, voyageurId: 2, dateArrivee: '2026-05-01', dateDepart: '2026-05-03', total: 16000, statut: 'en attente' })
];

export const getMesReservations = async (userId) => {
  await mockDelay(1000);
  return reservations.filter(r => r.voyageurId === userId);
};

export const reserver = async (reservationData) => {
  await mockDelay(1500); // Simulate payment process
  const logement = await getLogementById(reservationData.logementId);
  const newReservation = new Reservation({
    id: Date.now(),
    ...reservationData,
    statut: 'en attente'
  });
  reservations.push(newReservation);
  return newReservation;
};

export const annulerReservation = async (reservationId) => {
  await mockDelay(800);
  const res = reservations.find(r => r.id === reservationId);
  if (res) res.statut = 'annulée';
  return res;
};
>>>>>>> de3ca1ab7141bff088d354dd13bdca89f7cc6f67
