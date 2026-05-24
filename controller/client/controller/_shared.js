import { API_ORIGIN } from '../config.js';

export const resolveMediaUrl = (value) => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API_ORIGIN}${value.startsWith('/') ? value : `/${value}`}`;
};

export const normalizeArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

export const mapReview = (review) => ({
  ...review,
  auteur: [review.voyageur_prenom, review.voyageur_nom].filter(Boolean).join(' ') || 'Voyageur',
  auteurPhoto: resolveMediaUrl(review.voyageur_photo),
  noteLogement: Number(review.note_logement ?? review.noteLogement ?? 0),
  noteHote: Number(review.note_hote ?? review.noteHote ?? 0),
});

export const mapUser = (user) =>
  user
    ? {
        ...user,
        nomComplet: [user.prenom, user.nom].filter(Boolean).join(' '),
        photo_profil: resolveMediaUrl(user.photo_profil),
      }
    : null;

export const mapConversation = (conversation) => ({
  ...conversation,
  interlocuteur_photo: resolveMediaUrl(conversation.interlocuteur_photo),
  derniere_photo: resolveMediaUrl(conversation.derniere_photo),
});

export const mapMessage = (message) => ({
  ...message,
  expediteur_photo: resolveMediaUrl(message.expediteur_photo),
  photo_url: resolveMediaUrl(message.photo_url),
});

export const mapNotification = (notification) => ({
  ...notification,
  meta: notification.meta || null,
});

export const mapListing = (row) => {
  const photos = normalizeArray(row.photos).map(resolveMediaUrl);
  const equipements = normalizeArray(row.equipements);
  return {
    ...row,
    photos,
    equipements,
    prix: Number(row.prix_par_nuit ?? row.prix ?? 0),
    type: row.type_logement ?? row.type ?? '',
    ville: row.ville ?? row.adresse ?? '',
    note: Number(row.note_moyenne ?? row.note ?? 0),
    nbAvis: Number(row.nb_avis ?? 0),
    voyageurs: Number(row.capacite_accueil ?? row.voyageurs ?? 0),
    chambres: Number(row.nb_chambres ?? row.chambres ?? 0),
    lits: Number(row.nb_lits ?? row.lits ?? 0),
    sallesDeBain: Number(row.nb_salles_de_bain ?? row.sallesDeBain ?? 0),
    lat: row.latitude == null ? null : Number(row.latitude),
    lng: row.longitude == null ? null : Number(row.longitude),
    hote: {
      id: row.id_hote,
      nom: [row.hote_prenom, row.hote_nom].filter(Boolean).join(' '),
      photo: resolveMediaUrl(row.hote_photo),
      verifie: Boolean(row.hote_verifie),
    },
    echange: {
      estOuvert: Boolean(row.echange_ouvert),
      message: row.echange_message || '',
    },
    avis: normalizeArray(row.avis).map(mapReview),
    disponibilites: normalizeArray(row.disponibilites),
  };
};

export const mapReservation = (row) => ({
  ...row,
  montant_total: Number(row.montant_total ?? 0),
  sous_total: Number(row.sous_total ?? 0),
  frais_service: Number(row.frais_service ?? 0),
  prix_par_nuit: Number(row.prix_par_nuit ?? row.logement_prix_par_nuit ?? 0),
  has_review: Boolean(row.has_review),
  photos: normalizeArray(row.photos).map(resolveMediaUrl),
});

export const mapExchange = (row) => ({
  ...row,
  logement_demandeur_photos: normalizeArray(row.logement_demandeur_photos).map(resolveMediaUrl),
  logement_receveur_photos: normalizeArray(row.logement_receveur_photos).map(resolveMediaUrl),
  id_logement_demandeur: Number(row.id_logement_demandeur),
  id_logement_receveur: Number(row.id_logement_receveur),
  id_hote_demandeur: Number(row.id_hote_demandeur),
  id_hote_receveur: Number(row.id_hote_receveur),
});
