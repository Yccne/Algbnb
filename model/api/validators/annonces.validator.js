const {
  getLocationIqKey,
  isValidAlgeriaCoordinate,
  locationNamesMatch,
  reverseLocation,
} = require('../utils/geoLocation');

const parseEquipements = (equipements) => {
  if (!equipements) return [];
  if (Array.isArray(equipements)) return equipements;
  if (typeof equipements === 'string') {
    try {
      const parsed = JSON.parse(equipements);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) {
      return equipements
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const parsePhotoUrls = (photoUrls) => {
  if (!photoUrls) return [];
  if (Array.isArray(photoUrls)) return photoUrls.filter(Boolean);
  if (typeof photoUrls === 'string') {
    try {
      const parsed = JSON.parse(photoUrls);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (error) {
      return photoUrls
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const validateAnnoncePayload = async (body, files = [], { requirePhoto = true } = {}) => {
  const {
    titre,
    description,
    type_logement,
    adresse,
    ville,
    latitude,
    longitude,
    nb_chambres,
    nb_lits,
    nb_salles_de_bain,
    capacite_accueil,
    prix_par_nuit,
  } = body;

  const erreurs = [];
  const equipements = parseEquipements(body.equipements);
  const photoUrls = parsePhotoUrls(body.photo_urls);

  if (!titre || titre.trim().length < 5) erreurs.push('Le titre doit contenir au moins 5 caracteres.');
  if (!description || description.trim().length < 20) erreurs.push('La description doit contenir au moins 20 caracteres.');
  if (!type_logement) erreurs.push('Le type de logement est obligatoire.');
  if (!adresse || adresse.trim().length < 8) erreurs.push('Une adresse complete est obligatoire.');
  if (!ville || ville.trim().length < 2) erreurs.push('La ville est obligatoire.');
  if (!isValidAlgeriaCoordinate(latitude, longitude)) {
    erreurs.push('Place le logement exactement sur la carte avant de publier.');
  }

  const numericFields = [
    ['nb_chambres', nb_chambres, 0],
    ['nb_lits', nb_lits, 1],
    ['nb_salles_de_bain', nb_salles_de_bain, 1],
    ['capacite_accueil', capacite_accueil, 1],
    ['prix_par_nuit', prix_par_nuit, 1],
  ];

  for (const [label, value, min] of numericFields) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < min) {
      erreurs.push(`Le champ ${label} est invalide.`);
    }
  }

  if (requirePhoto && (!files || files.length === 0) && photoUrls.length === 0) {
    erreurs.push('Ajoute au moins une photo de logement ou une URL de photo.');
  }

  let reversedLocation = null;
  if (erreurs.length === 0 && getLocationIqKey()) {
    try {
      reversedLocation = await reverseLocation(latitude, longitude);
      const cityMatches =
        locationNamesMatch(ville, reversedLocation.city) ||
        locationNamesMatch(ville, reversedLocation.state);

      if (!cityMatches) {
        const actualPlace = reversedLocation.city || reversedLocation.state || reversedLocation.displayName;
        erreurs.push(`La ville "${ville}" ne correspond pas au point place sur la carte (${actualPlace}).`);
      }
    } catch (error) {
      erreurs.push(error.message || 'Impossible de verifier la position sur la carte.');
    }
  }

  return { erreurs, equipements, photoUrls, reversedLocation };
};

module.exports = {
  parseEquipements,
  parsePhotoUrls,
  validateAnnoncePayload,
};
