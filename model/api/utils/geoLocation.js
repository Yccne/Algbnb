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

const reverseLocation = async (latitude, longitude) => {
  if (!isValidAlgeriaCoordinate(latitude, longitude)) {
    throw createGeoError('La position doit etre en Algerie.', 400);
  }

  const apiKey = getLocationIqKey();
  if (!apiKey) {
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

  const response = await fetch(url);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
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
