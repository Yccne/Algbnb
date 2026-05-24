const cityFields = [
  'city',
  'town',
  'village',
  'municipality',
  'suburb',
  'city_district',
  'county',
  'state',
];

const normalizePlaceName = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b(wilaya|daira|commune|province|arrondissement)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const getAddressCity = (address = {}) => {
  for (const field of cityFields) {
    if (address[field]) return String(address[field]).trim();
  }
  return '';
};

const locationNamesMatch = (left, right) => {
  const normalizedLeft = normalizePlaceName(left);
  const normalizedRight = normalizePlaceName(right);
  if (!normalizedLeft || !normalizedRight) return false;
  return (
    normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft)
  );
};

const isValidAlgeriaCoordinate = (latitude, longitude) => {
  const lat = Number(latitude);
  const lng = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 18 && lat <= 38 && lng >= -9 && lng <= 12;
};

const getLocationIqKey = () => process.env.LOCATIONIQ_KEY || process.env.VITE_LOCATIONIQ_KEY || '';

const createGeoError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const reverseCache = new Map();

const fallbackReverseLocations = [
  { city: 'Bejaia', state: 'Bejaia', lat: 36.7525, lon: 5.0550 },
  { city: 'El Kseur', state: 'Bejaia', lat: 36.68136, lon: 4.86153 },
  { city: 'Alger', state: 'Alger', lat: 36.7538, lon: 3.0588 },
  { city: 'Oran', state: 'Oran', lat: 35.6971, lon: -0.6308 },
  { city: 'Constantine', state: 'Constantine', lat: 36.3650, lon: 6.6147 },
  { city: 'Setif', state: 'Setif', lat: 36.1911, lon: 5.4137 },
  { city: 'Tizi Ouzou', state: 'Tizi Ouzou', lat: 36.7118, lon: 4.0459 },
  { city: 'Timimoun', state: 'Timimoun', lat: 29.2639, lon: 0.2306 },
  { city: 'Djanet', state: 'Djanet', lat: 24.5528, lon: 9.4840 },
  { city: 'Tamanrasset', state: 'Tamanrasset', lat: 22.7850, lon: 5.5228 },
  { city: 'Beni Abbes', state: 'Beni Abbes', lat: 30.1333, lon: -2.1667 },
  { city: 'El Menia', state: 'El Menia', lat: 30.5833, lon: 2.8833 },
];

const fallbackReverseLocation = (latitude, longitude) => {
  const lat = Number(latitude);
  const lon = Number(longitude);
  const nearest = fallbackReverseLocations
    .map((location) => ({
      ...location,
      distance: Math.hypot(location.lat - lat, location.lon - lon),
    }))
    .sort((left, right) => left.distance - right.distance)[0];

  if (!nearest || nearest.distance > 0.45) {
    return null;
  }

  return {
    displayName: `${nearest.city}, ${nearest.state}, Algerie`,
    city: nearest.city,
    state: nearest.state,
    country: 'Algerie',
    countryCode: 'dz',
    lat,
    lon,
    fallback: true,
  };
};

const reverseLocation = async (latitude, longitude) => {
  if (!isValidAlgeriaCoordinate(latitude, longitude)) {
    throw createGeoError('La position doit etre en Algerie.', 400);
  }

  const apiKey = getLocationIqKey();
  if (!apiKey) {
    const fallback = fallbackReverseLocation(latitude, longitude);
    if (fallback) return fallback;
    throw createGeoError('LOCATIONIQ_KEY manquante dans .env.', 503);
  }

  const lat = Number(latitude).toFixed(7);
  const lon = Number(longitude).toFixed(7);
  const cacheKey = `${lat},${lon}`;
  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey);
  }

  const url = new URL('https://api.locationiq.com/v1/reverse');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lon', lon);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'fr');
  url.searchParams.set('normalizecity', '1');
  url.searchParams.set('countrycodes', 'dz');

  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    const fallback = fallbackReverseLocation(latitude, longitude);
    if (fallback) {
      reverseCache.set(cacheKey, fallback);
      return fallback;
    }
    throw createGeoError('Impossible de verifier la position sur la carte.', 502);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 429 || response.status >= 500) {
      const fallback = fallbackReverseLocation(latitude, longitude);
      if (fallback) {
        reverseCache.set(cacheKey, fallback);
        return fallback;
      }
    }
    throw createGeoError(data.error || 'Impossible de verifier la position sur la carte.', response.status || 502);
  }

  const address = data.address || {};
  const countryCode = String(address.country_code || '').toLowerCase();
  if (countryCode && countryCode !== 'dz') {
    throw createGeoError('La position doit etre en Algerie.', 400);
  }

  const location = {
    displayName: data.display_name || '',
    city: getAddressCity(address),
    state: address.state || address.region || '',
    country: address.country || '',
    countryCode,
    lat: Number(data.lat || latitude),
    lon: Number(data.lon || longitude),
  };

  reverseCache.set(cacheKey, location);
  return location;
};

module.exports = {
  getLocationIqKey,
  isValidAlgeriaCoordinate,
  locationNamesMatch,
  normalizePlaceName,
  reverseLocation,
};
