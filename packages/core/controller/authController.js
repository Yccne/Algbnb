import { Utilisateur } from '../model/Utilisateur.js';

const mockDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let currentUser = null;

export const login = async (email, password) => {
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
