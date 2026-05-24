const { badRequest } = require('../utils/httpError');

const isTrue = (value) => ['true', '1', 'yes', 'on'].includes(String(value || '').toLowerCase());

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const readNumber = (readValue, key, { min = 0, message }) => {
  const raw = readValue(key);
  if (raw === undefined || raw === null || raw === '') return null;
  const number = Number(raw);
  if (!Number.isFinite(number) || number < min) {
    throw badRequest(message);
  }
  return number;
};

const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const validateDateRange = (dateArrivee, dateDepart) => {
  if (!dateArrivee && !dateDepart) return;
  if (!isValidDateString(dateArrivee) || !isValidDateString(dateDepart)) {
    throw badRequest('Les deux dates de sejour doivent etre renseignees au format valide.');
  }
  if (dateDepart <= dateArrivee) {
    throw badRequest('La date de depart doit etre apres la date d arrivee.');
  }
};

const buildGeoBounds = (readValue) => {
  const minLat = toFiniteNumber(readValue('placeMinLat', 'minLat'));
  const maxLat = toFiniteNumber(readValue('placeMaxLat', 'maxLat'));
  const minLng = toFiniteNumber(readValue('placeMinLng', 'minLng', 'placeMinLon', 'minLon'));
  const maxLng = toFiniteNumber(readValue('placeMaxLng', 'maxLng', 'placeMaxLon', 'maxLon'));
  const lat = toFiniteNumber(readValue('placeLat', 'lat'));
  const lng = toFiniteNumber(readValue('placeLng', 'lng', 'placeLon', 'lon'));

  if (![minLat, maxLat, minLng, maxLng].every(Number.isFinite)) {
    return null;
  }

  const boundedMinLat = Math.max(-90, Math.min(minLat, maxLat));
  const boundedMaxLat = Math.min(90, Math.max(minLat, maxLat));
  const boundedMinLng = Math.max(-180, Math.min(minLng, maxLng));
  const boundedMaxLng = Math.min(180, Math.max(minLng, maxLng));

  if (boundedMinLat === boundedMaxLat || boundedMinLng === boundedMaxLng) {
    return null;
  }

  return {
    minLat: boundedMinLat,
    maxLat: boundedMaxLat,
    minLng: boundedMinLng,
    maxLng: boundedMaxLng,
    lat: Number.isFinite(lat) ? lat : (boundedMinLat + boundedMaxLat) / 2,
    lng: Number.isFinite(lng) ? lng : (boundedMinLng + boundedMaxLng) / 2,
    label: String(readValue('placeLabel') || '').trim(),
  };
};

const buildSearchContext = (query, originalUrl = '') => {
  const fallbackParams = originalUrl ? new URL(originalUrl, 'http://local').searchParams : null;
  const readValue = (...keys) => {
    for (const key of keys) {
      if (query[key] !== undefined) {
        return query[key];
      }
      const fallbackValue = fallbackParams?.get(key);
      if (fallbackValue !== null && fallbackValue !== undefined) {
        return fallbackValue;
      }
    }
    return undefined;
  };

  const rawUrl = String(originalUrl || '');
  const limit = Math.min(24, Math.max(1, Number(readValue('limit') || 12)));
  const page = Math.max(1, Number(readValue('page') || 1));
  const offset =
    readValue('offset') !== undefined && readValue('offset') !== ''
      ? Math.max(0, Number(readValue('offset')))
      : (page - 1) * limit;
  const geoBounds = buildGeoBounds(readValue);
  const prixMin = readNumber(readValue, 'prixMin', {
    min: 0,
    message: 'Le prix minimum doit etre un nombre positif.',
  });
  const prixMax = readNumber(readValue, 'prixMax', {
    min: 0,
    message: 'Le prix maximum doit etre un nombre positif.',
  });
  if (prixMin !== null && prixMax !== null && prixMin > prixMax) {
    throw badRequest('Le prix maximum doit etre superieur au prix minimum.');
  }

  const chambres = readNumber(readValue, 'chambres', {
    min: 0,
    message: 'Le nombre de chambres ne peut pas etre negatif.',
  });
  const lits = readNumber(readValue, 'lits', {
    min: 0,
    message: 'Le nombre de lits ne peut pas etre negatif.',
  });
  const voyageurs = readNumber(readValue, 'voyageurs', {
    min: 1,
    message: 'Le nombre de voyageurs doit etre au moins 1.',
  });
  const dateArrivee = readValue('availableStart', 'dateArrivee', 'date_arrivee') || '';
  const dateDepart = readValue('availableEnd', 'dateDepart', 'date_depart') || '';
  validateDateRange(dateArrivee, dateDepart);

  return {
    search: normalizeText(readValue('search')),
    geoBounds,
    placeLabel: geoBounds?.label || '',
    type: String(readValue('type') || '').trim(),
    prixMin,
    prixMax,
    chambres,
    lits,
    voyageurs,
    dateArrivee,
    dateDepart,
    equipements: (
      Array.isArray(query.equipements)
        ? query.equipements
        : String(readValue('equipements') || '').split(',')
    )
      .map((item) => String(item).trim())
      .filter(Boolean),
    annulationGratuite: isTrue(readValue('annulationGratuite')),
    bienNote: isTrue(readValue('bienNote')),
    hoteVerifie: isTrue(readValue('hoteVerifie')),
    limit,
    offset,
    paginated:
      isTrue(readValue('paginated')) ||
      rawUrl.includes('paginated=') ||
      rawUrl.includes('limit=') ||
      rawUrl.includes('offset=') ||
      rawUrl.includes('page='),
    sort: String(readValue('sort') || '').trim().toLowerCase(),
  };
};

module.exports = {
  buildSearchContext,
  buildGeoBounds,
  isTrue,
  normalizeText,
};
