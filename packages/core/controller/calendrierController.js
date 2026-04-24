import { get, put } from '../apiClient.js';

export const getDisponibilites = async (logementId) => get(`/logements/${logementId}/disponibilites`);

export const setDisponibilites = async (logementId, disponibilites) =>
  put(`/annonces/${logementId}/disponibilites`, { disponibilites });

export const bloquerDate = async (logementId, dateString) =>
  setDisponibilites(logementId, [{ date_debut: dateString, date_fin: dateString, est_bloque: true, source_blocage: 'manuel' }]);
