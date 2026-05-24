const logementsRepository = require('../repositories/logements.repository');
const { buildSearchContext } = require('../validators/logements.validator');
const { buildPaginatedResponse } = require('../models/pagination.model');
const { normalizePlaceName, reverseLocation } = require('../utils/geoLocation');
const { badRequest, notFound } = require('../utils/httpError');

const locationFallbacks = [
  {
    place_id: 'fallback-bejaia',
    display_name: 'Bejaia, Algerie',
    lat: '36.7525000',
    lon: '5.0550000',
    address: { city: 'Bejaia', state: 'Bejaia', country: 'Algerie', country_code: 'dz' },
  },
  {
    place_id: 'fallback-alger',
    display_name: 'Alger, Algerie',
    lat: '36.7538000',
    lon: '3.0588000',
    address: { city: 'Alger', state: 'Alger', country: 'Algerie', country_code: 'dz' },
  },
  {
    place_id: 'fallback-oran',
    display_name: 'Oran, Algerie',
    lat: '35.6971000',
    lon: '-0.6308000',
    address: { city: 'Oran', state: 'Oran', country: 'Algerie', country_code: 'dz' },
  },
  {
    place_id: 'fallback-constantine',
    display_name: 'Constantine, Algerie',
    lat: '36.3650000',
    lon: '6.6147000',
    address: { city: 'Constantine', state: 'Constantine', country: 'Algerie', country_code: 'dz' },
  },
  {
    place_id: 'fallback-annaba',
    display_name: 'Annaba, Algerie',
    lat: '36.9000000',
    lon: '7.7667000',
    address: { city: 'Annaba', state: 'Annaba', country: 'Algerie', country_code: 'dz' },
  },
  {
    place_id: 'fallback-timimoun',
    display_name: 'Timimoun, Algerie',
    lat: '29.2639000',
    lon: '0.2306000',
    address: { city: 'Timimoun', state: 'Timimoun', country: 'Algerie', country_code: 'dz' },
  },
  {
    place_id: 'fallback-djanet',
    display_name: 'Djanet, Algerie',
    lat: '24.5528000',
    lon: '9.4840000',
    address: { city: 'Djanet', state: 'Djanet', country: 'Algerie', country_code: 'dz' },
  },
  {
    place_id: 'fallback-tamanrasset',
    display_name: 'Tamanrasset, Algerie',
    lat: '22.7850000',
    lon: '5.5228000',
    address: { city: 'Tamanrasset', state: 'Tamanrasset', country: 'Algerie', country_code: 'dz' },
  },
  {
    place_id: 'fallback-beni-abbes',
    display_name: 'Beni Abbes, Algerie',
    lat: '30.1333000',
    lon: '-2.1667000',
    address: { city: 'Beni Abbes', state: 'Beni Abbes', country: 'Algerie', country_code: 'dz' },
  },
  {
    place_id: 'fallback-el-menia',
    display_name: 'El Menia, Algerie',
    lat: '30.5833000',
    lon: '2.8833000',
    address: { city: 'El Menia', state: 'El Menia', country: 'Algerie', country_code: 'dz' },
  },
];

const expandBounds = ({ minLat, maxLat, minLng, maxLng, lat, lon }, minDelta = 0.04) => {
  const centerLat = Number(lat);
  const centerLng = Number(lon);
  let south = Number.isFinite(Number(minLat)) ? Number(minLat) : centerLat - minDelta;
  let north = Number.isFinite(Number(maxLat)) ? Number(maxLat) : centerLat + minDelta;
  let west = Number.isFinite(Number(minLng)) ? Number(minLng) : centerLng - minDelta;
  let east = Number.isFinite(Number(maxLng)) ? Number(maxLng) : centerLng + minDelta;

  if (Math.abs(north - south) < minDelta) {
    south = centerLat - minDelta;
    north = centerLat + minDelta;
  }
  if (Math.abs(east - west) < minDelta) {
    west = centerLng - minDelta;
    east = centerLng + minDelta;
  }

  return [
    south.toFixed(7),
    north.toFixed(7),
    west.toFixed(7),
    east.toFixed(7),
  ];
};

const withFallbackBounds = (location) => ({
  ...location,
  boundingbox: expandBounds({ lat: location.lat, lon: location.lon }),
});

const fallbackLocationSearch = (searchText) => {
  const normalizedQuery = normalizePlaceName(searchText);
  if (!normalizedQuery) return [];
  return locationFallbacks.filter((location) => {
    const haystack = normalizePlaceName(`${location.display_name} ${location.address.city} ${location.address.state}`);
    return haystack.includes(normalizedQuery) || normalizedQuery.includes(normalizePlaceName(location.address.city));
  }).map(withFallbackBounds);
};

const formatLocalLocation = (row) => {
  const city = String(row.ville || '').trim();
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  return {
    place_id: `local-${normalizePlaceName(city) || city}`,
    display_name: `${city}, Algerie`,
    lat: Number.isFinite(lat) ? lat.toFixed(7) : '',
    lon: Number.isFinite(lon) ? lon.toFixed(7) : '',
    boundingbox: expandBounds({
      minLat: row.min_lat,
      maxLat: row.max_lat,
      minLng: row.min_lng,
      maxLng: row.max_lng,
      lat,
      lon,
    }),
    address: {
      city,
      state: city,
      country: 'Algerie',
      country_code: 'dz',
    },
    source: 'local',
    nb_logements: row.nb_logements,
  };
};

const dedupeLocations = (locations) => {
  const seen = new Set();
  return locations.filter((location) => {
    const city = location?.address?.city || location?.address?.town || location?.address?.village || location?.display_name || '';
    const key = normalizePlaceName(city);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

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
  if (q.length < 3) {
    return [];
  }

  const localLocations = await logementsRepository
    .findLocationSuggestions(normalizePlaceName(q), 5)
    .then((rows) => rows.map(formatLocalLocation))
    .catch(() => []);

  if (!apiKey) {
    return dedupeLocations([...localLocations, ...fallbackLocationSearch(q)]).slice(0, 5);
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

  try {
    const response = await fetch(url);
    const data = await response.json().catch(() => []);
    if (!response.ok) {
      return dedupeLocations([...localLocations, ...fallbackLocationSearch(q)]).slice(0, 5);
    }
    const externalLocations = Array.isArray(data) ? data : fallbackLocationSearch(q);
    return dedupeLocations([...localLocations, ...externalLocations, ...fallbackLocationSearch(q)]).slice(0, 5);
  } catch {
    const fallback = fallbackLocationSearch(q);
    return dedupeLocations([...localLocations, ...fallback]).slice(0, 5);
  }
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
