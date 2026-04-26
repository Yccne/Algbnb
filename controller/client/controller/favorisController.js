import { del, get, post } from '../apiClient.js';
import { mapListing } from './_shared.js';

export const getFavoris = async () => {
  const data = await get('/favoris');
  return data.map(mapListing);
};

export const ajouterFavori = async (logementId) => post(`/favoris/${logementId}`);
export const supprimerFavori = async (logementId) => del(`/favoris/${logementId}`);
