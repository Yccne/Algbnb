import { get, patch, post } from '../apiClient.js';
import { mapExchange, mapListing } from './_shared.js';

export const getMyExchanges = async () => {
  const data = await get('/echanges/me');
  return data.map(mapExchange);
};

export const getOpenExchangeListings = async () => {
  const data = await get('/echanges/logements-ouverts');
  return data.map(mapListing);
};

export const updateExchangePreference = async (logementId, payload) =>
  patch(`/echanges/logements/${logementId}/preference`, payload);

export const createExchange = async (payload) => {
  const data = await post('/echanges', payload);
  return mapExchange(data);
};

export const proposeRequesterDates = async (exchangeId, payload) => {
  const data = await patch(`/echanges/${exchangeId}/proposition-demandeur`, payload);
  return mapExchange(data);
};

export const respondAsReceiver = async (exchangeId, payload) => {
  const data = await patch(`/echanges/${exchangeId}/reponse-receveur`, payload);
  return mapExchange(data);
};

export const decideFinal = async (exchangeId, payload) => {
  const data = await patch(`/echanges/${exchangeId}/decision-finale`, payload);
  return mapExchange(data);
};

export const cancelExchange = async (exchangeId, payload = {}) => {
  const data = await patch(`/echanges/${exchangeId}/annuler`, payload);
  return mapExchange(data);
};
