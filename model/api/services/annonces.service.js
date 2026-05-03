const annoncesRepository = require('../repositories/annonces.repository');
const { parseEquipements, parsePhotoUrls, validateAnnoncePayload } = require('../validators/annonces.validator');
const { badRequest, notFound } = require('../utils/httpError');

const mergePhotos = (files = [], photoUrls = []) => [
  ...files.map((file) => `/uploads/logements/${file.filename}`),
  ...photoUrls,
];

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
  const logement = await annoncesRepository.updateListing({
    listingId,
    payload,
    photos,
    equipements: validation.equipements,
    replacePhotos: files.length > 0 || inputPayload.photo_urls !== undefined,
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
  const ranges = Array.isArray(disponibilites) ? disponibilites : [];
  return annoncesRepository.replaceAvailability({ listingId, ranges });
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