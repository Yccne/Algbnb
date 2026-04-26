const isTrue = (value) => ['true', '1', 'yes', 'on'].includes(String(value || '').toLowerCase());

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

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

  return {
    search: normalizeText(readValue('search')),
    type: String(readValue('type') || '').trim(),
    prixMin: readValue('prixMin') !== undefined && readValue('prixMin') !== '' ? Number(readValue('prixMin')) : null,
    prixMax: readValue('prixMax') !== undefined && readValue('prixMax') !== '' ? Number(readValue('prixMax')) : null,
    chambres: readValue('chambres') !== undefined && readValue('chambres') !== '' ? Number(readValue('chambres')) : null,
    lits: readValue('lits') !== undefined && readValue('lits') !== '' ? Number(readValue('lits')) : null,
    voyageurs: readValue('voyageurs') !== undefined && readValue('voyageurs') !== '' ? Number(readValue('voyageurs')) : null,
    dateArrivee: readValue('availableStart', 'dateArrivee', 'date_arrivee') || '',
    dateDepart: readValue('availableEnd', 'dateDepart', 'date_depart') || '',
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
  isTrue,
  normalizeText,
};
