<<<<<<< HEAD
const API_URL = 'http://localhost:3001/api';
=======
import { Utilisateur } from '../model/Utilisateur.js';

const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
>>>>>>> de3ca1ab7141bff088d354dd13bdca89f7cc6f67

let currentUser = null;

export const login = async (email, password) => {
<<<<<<< HEAD
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
=======
  await mockDelay(800);
  if (email === 'admin@algbnb.com') {
    currentUser = new Utilisateur({ id: 1, nom: 'Admin', email, role: 'admin' });
  } else {
    currentUser = new Utilisateur({ id: 2, nom: 'John Doe', email, role: 'voyageur' });
  }
  return currentUser;
};

export const register = async (userData) => {
  await mockDelay(800);
  currentUser = new Utilisateur({ id: 3, ...userData, role: 'voyageur' });
  return currentUser;
};

export const logout = async () => {
  await mockDelay(400);
  currentUser = null;
  return true;
};

export const getCurrentUser = () => currentUser;
>>>>>>> de3ca1ab7141bff088d354dd13bdca89f7cc6f67
