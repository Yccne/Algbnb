const API_URL = 'http://localhost:3001/api';

export const getLogements = async () => {
  const res = await fetch(`${API_URL}/logements`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};

export const getLogement = async (id) => {
  const res = await fetch(`${API_URL}/logements/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};

export const creerLogement = async (logementData) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/logements`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(logementData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};

export const supprimerLogement = async (id) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/logements/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  return data;
};