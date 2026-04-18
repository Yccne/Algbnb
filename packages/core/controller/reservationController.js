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