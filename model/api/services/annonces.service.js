const annoncesRepository = require('../repositories/annonces.repository');
const {
  MIN_LISTING_PHOTOS,
  MIN_LISTING_PHOTOS_MESSAGE,
  parseEquipements,
  parsePhotoUrls,
  validateAnnoncePayload,
} = require('../validators/annonces.validator');
const { badRequest, conflict, notFound } = require('../utils/httpError');

const mergePhotos = (files = [], photoUrls = []) => [
  ...files.map((file) => `/uploads/logements/${file.filename}`),
  ...photoUrls,
];

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const rangesOverlapInclusive = (left, right) =>
  !(left.date_fin < right.date_debut || left.date_debut > right.date_fin);

const normalizeAvailabilityRanges = (disponibilites) => {
  const ranges = Array.isArray(disponibilites) ? disponibilites : [];
  const normalized = ranges
    .filter((range) => range && (range.date_debut || range.date_fin))
    .map((range) => ({
      date_debut: String(range.date_debut || '').slice(0, 10),
      date_fin: String(range.date_fin || '').slice(0, 10),
      est_bloque: range.est_bloque !== false,
      source_blocage: 'manuel',
      note_interne: String(range.note_interne || '').trim().slice(0, 300),
    }));

  for (const range of normalized) {
    if (!isIsoDate(range.date_debut) || !isIsoDate(range.date_fin)) {
      throw badRequest('Chaque blocage doit avoir une date de debut et une date de fin valides.');
    }
    if (range.date_fin < range.date_debut) {
      throw badRequest('La date de fin du blocage doit etre egale ou posterieure a la date de debut.');
    }
  }

  const sorted = [...normalized].sort((a, b) => a.date_debut.localeCompare(b.date_debut));
  for (let index = 0; index < sorted.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < sorted.length; nextIndex += 1) {
      if (rangesOverlapInclusive(sorted[index], sorted[nextIndex])) {
        throw badRequest('Deux blocages ne peuvent pas se chevaucher.');
      }
    }
  }

  return normalized;
};

const requireOwner = async ({ listingId, userId }) => {
  const listing = await annoncesRepository.findOwnedListing({ listingId, userId });
  if (!listing) {
    throw notFound('Annonce introuvable.');
  }
  return listing;
};

const create = async ({ userId, payload, files = [] }) => {
  const equipements = Array.isArray(payload.equipements) ? payload.equipements : parseEquipements(payload.equipements);
  const photoUrls = Array.isArray(payload.photo_urls) ? payload.photo_urls : parsePhotoUrls(payload.photo_urls);
  if (photoUrls.length > 0) {
    throw badRequest('Ajoute les photos depuis ton appareil. Les URLs d images ne sont plus acceptees.');
  }
  if (!files || files.length < MIN_LISTING_PHOTOS) {
    throw badRequest(MIN_LISTING_PHOTOS_MESSAGE);
  }
  const photos = mergePhotos(files, photoUrls);
  const logement = await annoncesRepository.createListing({
    ownerId: userId,
    payload,
    photos,
    equipements,
  });
  return {
    message: 'Annonce creee avec succes.',
    logement,
  };
};

const listMine = (userId) => annoncesRepository.listByOwner(userId);

const detailMine = async ({ listingId, userId }) => {
  await requireOwner({ listingId, userId });
  return annoncesRepository.findDetail(listingId);
};

const update = async ({ listingId, userId, payload: inputPayload, files = [] }) => {
  const listing = await requireOwner({ listingId, userId });
  const currentDetail = await annoncesRepository.findDetail(listingId);
  const existingPhotos = Array.isArray(currentDetail?.photos) ? currentDetail.photos : [];
  const payload = {
    titre: inputPayload.titre ?? listing.titre,
    description: inputPayload.description ?? listing.description,
    type_logement: inputPayload.type_logement ?? listing.type_logement,
    adresse: inputPayload.adresse ?? listing.adresse,
    ville: inputPayload.ville ?? listing.ville,
    pays: inputPayload.pays ?? listing.pays,
    latitude: inputPayload.latitude ?? listing.latitude,
    longitude: inputPayload.longitude ?? listing.longitude,
    nb_chambres: inputPayload.nb_chambres ?? listing.nb_chambres,
    nb_lits: inputPayload.nb_lits ?? listing.nb_lits,
    nb_salles_de_bain: inputPayload.nb_salles_de_bain ?? listing.nb_salles_de_bain,
    capacite_accueil: inputPayload.capacite_accueil ?? listing.capacite_accueil,
    prix_par_nuit: inputPayload.prix_par_nuit ?? listing.prix_par_nuit,
    mode_reservation: inputPayload.mode_reservation ?? listing.mode_reservation,
    politique_annulation: inputPayload.politique_annulation ?? listing.politique_annulation,
    regles_maison: inputPayload.regles_maison ?? listing.regles_maison,
    compte_ccp: inputPayload.compte_ccp !== undefined ? inputPayload.compte_ccp : listing.compte_ccp,
    validation_statut: inputPayload.validation_statut ?? listing.validation_statut,
    est_actif: typeof inputPayload.est_actif === 'boolean' ? inputPayload.est_actif : listing.est_actif,
    equipements: inputPayload.equipements,
    photo_urls: inputPayload.photo_urls,
  };

  const validation = await validateAnnoncePayload(payload, files, { requirePhoto: false });
  if (validation.erreurs.length > 0) {
    throw badRequest('Annonce invalide.', { erreurs: validation.erreurs });
  }

  const uploadedPhotos = files.map((file) => `/uploads/logements/${file.filename}`);
  const photos = [...uploadedPhotos, ...validation.photoUrls];
  const effectivePhotoCount = files.length > 0 ? photos.length : existingPhotos.length;
  if (effectivePhotoCount < MIN_LISTING_PHOTOS) {
    throw badRequest(MIN_LISTING_PHOTOS_MESSAGE);
  }

  const logement = await annoncesRepository.updateListing({
    listingId,
    payload,
    photos,
    equipements: validation.equipements,
    replacePhotos: files.length > 0,
    replaceEquipements: inputPayload.equipements !== undefined,
  });

  return { logement };
};

const updateStatus = async ({ listingId, userId, active }) => {
  await requireOwner({ listingId, userId });
  const logement = await annoncesRepository.updateActiveStatus({ listingId, active: Boolean(active) });
  return { logement };
};

const replaceAvailability = async ({ listingId, userId, disponibilites }) => {
  await requireOwner({ listingId, userId });
  const ranges = normalizeAvailabilityRanges(disponibilites);
  try {
    return await annoncesRepository.replaceAvailability({ listingId, ranges });
  } catch (error) {
    if (error.code === 'AVAILABILITY_CONFLICT') {
      throw conflict(error.message);
    }
    throw error;
  }
};

const remove = async ({ listingId, userId }) => {
  await requireOwner({ listingId, userId });
  await annoncesRepository.softDelete(listingId);
  return { message: 'Annonce supprimee.' };
};

module.exports = {
  create,
  detailMine,
  listMine,
  remove,
  replaceAvailability,
  update,
  updateStatus,
};
