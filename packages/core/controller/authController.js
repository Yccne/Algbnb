const API_URL = 'http://localhost:3001/api';

let currentUser = null;

export const login = async (email, password) => {
  const res = await fetch(`${API_URL}/auth/connexion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, mot_de_passe: password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  currentUser = data.user;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
};

export const register = async (userData) => {
  const res = await fetch(`${API_URL}/auth/inscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.erreur);
  currentUser = data.user;
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
};

export const logout = async () => {
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  return true;
};

export const getCurrentUser = () => {
  if (currentUser) return currentUser;
  const saved = localStorage.getItem('user');
  return saved ? JSON.parse(saved) : null;
};
