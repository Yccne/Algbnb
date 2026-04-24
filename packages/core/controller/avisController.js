import { get, patch, post } from '../apiClient.js';
import { mapReview } from './_shared.js';

export const getAvisByLogement = async (logementId) => {
  const data = await get(`/avis/logement/${logementId}`);
  return data.map(mapReview);
};

export const laisserAvis = async (avisData) => {
  const data = await post('/avis', avisData);
  return mapReview(data);
};

export const setAvisVisible = async (id, est_visible) => patch(`/avis/${id}/visibility`, { est_visible });
