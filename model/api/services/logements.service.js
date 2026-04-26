const logementsRepository = require('../repositories/logements.repository');
const { buildSearchContext } = require('../validators/logements.validator');
const { buildPaginatedResponse } = require('../models/pagination.model');
const { reverseLocation } = require('../utils/geoLocation');
const { badRequest, notFound, unavailable, createHttpError } = require('../utils/httpError');

const list = async ({ query, originalUrl }) => {
  const ctx = buildSearchContext(query, originalUrl);
  if (!ctx.paginated) {
    return logementsRepository.list(ctx);
  }
  const { items, total } = await logementsRepository.listPaginated(ctx);
  return buildPaginatedResponse({ items, total, limit: ctx.limit, offset: ctx.offset });
};

const listMap = async ({ query, originalUrl }) => {
  const ctx = buildSearchContext(query, originalUrl);
  return logementsRepository.listMap(ctx);
};

const searchLocations = async (searchText) => {
  const q = String(searchText || '').trim();
  const apiKey = process.env.LOCATIONIQ_KEY || process.env.VITE_LOCATIONIQ_KEY;
  if (!apiKey) {
    throw unavailable('LOCATIONIQ_KEY manquante dans .env.');
  }
  if (q.length < 3) {
    return [];
  }

  const url = new URL('https://api.locationiq.com/v1/autocomplete');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('q', q);
  url.searchParams.set('limit', '5');
  url.searchParams.set('dedupe', '1');
  url.searchParams.set('countrycodes', 'dz');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'fr');
  url.searchParams.set('format', 'json');

  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) {
    throw createHttpError(response.status, data.error || 'Erreur LocationIQ.');
  }
  return data;
};

const reverse = async ({ latitude, longitude }) => {
  if (latitude === undefined || longitude === undefined) {
    throw badRequest('Latitude et longitude sont requises.');
  }
  return reverseLocation(latitude, longitude);
};

const availability = (listingId) => logementsRepository.findAvailability(listingId);

const detail = async (listingId) => {
  const listing = await logementsRepository.findPublicDetail(listingId);
  if (!listing) {
    throw notFound('Logement introuvable.');
  }

  const [avis, disponibilites] = await Promise.all([
    logementsRepository.findReviewsForDetail(listingId),
    logementsRepository.findBlocksForDetail(listingId),
  ]);
  return {
    ...listing,
    avis,
    disponibilites,
  };
};

module.exports = {
  availability,
  detail,
  list,
  listMap,
  reverse,
  searchLocations,
};
