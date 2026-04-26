import { del, get, patch, post, put } from '../apiClient.js';
import { mapListing } from './_shared.js';

const objectToFormData = (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === 'photos' && Array.isArray(value)) {
      value.forEach((file) => formData.append('photos', file));
      return;
    }
    if (Array.isArray(value)) {
      formData.append(key, JSON.stringify(value));
      return;
    }
    formData.append(key, value);
  });
  return formData;
};

export const getLogements = async (filters = {}) => {
  const data = await get('/logements', filters);
  return data.map(mapListing);
};

export const searchLogements = async (filters = {}) => {
  const data = await get('/logements', { ...filters, paginated: true });
  return {
    ...data,
    items: (data.items || []).map(mapListing),
  };
};

export const getMapLogements = async (filters = {}) => {
  const data = await get('/logements/map', filters);
  return (data || []).map(mapListing);
};

export const getLogementById = async (id) => {
  const data = await get(`/logements/${id}`);
  return mapListing(data);
};

export const rechercherLogements = async (query) => getLogements({ search: query });

export const creerLogement = async (payload) => {
  const data = await post('/annonces', objectToFormData(payload));
  return mapListing(data.logement);
};

export const updateLogement = async (id, payload) => {
  const hasFilePhotos = Array.isArray(payload?.photos) && payload.photos.length > 0;
  const body = hasFilePhotos ? objectToFormData(payload) : payload;
  const data = await patch(`/annonces/${id}`, body);
  return mapListing(data.logement);
};

export const supprimerLogement = async (id) => del(`/annonces/${id}`);

export const getMesAnnonces = async () => {
  const data = await get('/annonces/mes-annonces');
  return data.map(mapListing);
};

export const togglePublication = async (id, est_actif) => {
  const data = await patch(`/annonces/${id}/statut`, { est_actif });
  return data.logement;
};

export const setDisponibilites = async (id, disponibilites) => put(`/annonces/${id}/disponibilites`, { disponibilites });
export const getDisponibilites = async (id) => get(`/logements/${id}/disponibilites`);
export const rechercherLieux = async (query) => get('/logements/location-search', { q: query });
export const reverseLocation = async ({ latitude, longitude }) =>
  get('/logements/reverse-location', { lat: latitude, lon: longitude });
