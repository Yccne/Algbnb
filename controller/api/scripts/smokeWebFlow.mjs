import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('dotenv').config();
const db = require('../../../model/api/db');

const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:3001/api').replace(/\/$/, '');

const demoUsers = {
  host: {
    email: 'hote.demo@algbnb.local',
    telephone: '0550000001',
    password: 'Demo123!',
    prenom: 'Nadia',
    nom: 'Mansouri',
    role_type: 'hote',
    photo_profil: '/uploads/profiles/demo-hote.svg',
  },
  hostExchange: {
    email: 'karim.haddad.demo@algbnb.local',
    telephone: '0550000005',
    password: 'Demo123!',
    prenom: 'Karim',
    nom: 'Haddad',
    role_type: 'hote',
    photo_profil: '/uploads/profiles/demo-hote.svg',
  },
  traveler: {
    email: 'voyageur.demo@algbnb.local',
    telephone: '0550000002',
    password: 'Demo123!',
    prenom: 'Yanis',
    nom: 'Bouzid',
    role_type: 'voyageur',
    photo_profil: '/uploads/profiles/demo-voyageur.svg',
  },
  admin: {
    email: 'admin.demo@algbnb.local',
    telephone: '0550000003',
    password: 'Demo123!',
    prenom: 'Admin',
    nom: 'Algbnb',
    role_type: 'admin',
    photo_profil: '/uploads/profiles/demo-hote.svg',
  },
};

const demoPhotoSets = {
  coastal: [
    '/uploads/logements/demo/coastal-1.jpg',
    '/uploads/logements/demo/coastal-2.jpg',
    '/uploads/logements/demo/coastal-3.jpg',
    '/uploads/logements/demo/coastal-4.jpg',
  ],
  urban: [
    '/uploads/logements/demo/urban-1.jpg',
    '/uploads/logements/demo/urban-2.jpg',
    '/uploads/logements/demo/urban-3.jpg',
    '/uploads/logements/demo/urban-4.jpg',
  ],
  family: [
    '/uploads/logements/demo/family-1.jpg',
    '/uploads/logements/demo/family-2.jpg',
    '/uploads/logements/demo/family-3.jpg',
    '/uploads/logements/demo/family-4.jpg',
  ],
};

const listingsToSeed = [
  {
    title: 'Appartement vue mer a Bejaia',
    city: 'Bejaia',
    photos: demoPhotoSets.coastal,
    form: {
      titre: 'Appartement vue mer a Bejaia',
      description:
        'Appartement lumineux avec balcon, cuisine equipee, wifi rapide et vue degagee sur la mer. Ideal pour une escapade a deux ou en famille.',
      type_logement: 'appartement',
      adresse: 'Corniche de Bejaia, Bejaia',
      ville: 'Bejaia',
      pays: 'Algerie',
      latitude: '36.7502',
      longitude: '5.0846',
      nb_chambres: '2',
      nb_lits: '3',
      nb_salles_de_bain: '1',
      capacite_accueil: '4',
      prix_par_nuit: '7800',
      mode_reservation: 'sur_approbation',
      politique_annulation: 'souple',
      regles_maison: 'Pas de fete, pas de cigarette en interieur.',
      equipements: JSON.stringify(['Wi-Fi', 'Cuisine equipee', 'Climatisation', 'Television']),
    },
    blockedRanges: [
      {
        date_debut: shiftDate(18),
        date_fin: shiftDate(20),
        est_bloque: true,
        source_blocage: 'manuel',
        note_interne: 'Blocage hote',
      },
    ],
  },
  {
    title: 'Loft urbain centre-ville',
    city: 'Alger',
    photos: demoPhotoSets.urban,
    form: {
      titre: 'Loft urbain centre-ville',
      description:
        'Loft spacieux et chaleureux au coeur de la ville avec salon ouvert, coin bureau et acces rapide aux transports.',
      type_logement: 'maison',
      adresse: 'Rue Didouche Mourad, Alger',
      ville: 'Alger',
      pays: 'Algerie',
      latitude: '36.7538',
      longitude: '3.0588',
      nb_chambres: '1',
      nb_lits: '2',
      nb_salles_de_bain: '1',
      capacite_accueil: '3',
      prix_par_nuit: '6200',
      mode_reservation: 'instantanee',
      politique_annulation: 'moderee',
      regles_maison: 'Respect du voisinage apres 22h.',
      equipements: JSON.stringify(['Wi-Fi', 'Cuisine equipee', 'Parking']),
    },
    blockedRanges: [],
  },
  {
    title: 'Maison familiale a El Kseur',
    city: 'El Kseur',
    photos: demoPhotoSets.family,
    form: {
      titre: 'Maison familiale a El Kseur',
      description:
        'Maison pratique avec jardin, cuisine equipee et stationnement, situee a El Kseur pour tester la recherche geographique autour de Bejaia.',
      type_logement: 'maison',
      adresse: 'Centre-ville, El Kseur',
      ville: 'El Kseur',
      pays: 'Algerie',
      latitude: '36.6813',
      longitude: '4.8615',
      nb_chambres: '2',
      nb_lits: '4',
      nb_salles_de_bain: '1',
      capacite_accueil: '5',
      prix_par_nuit: '5200',
      mode_reservation: 'sur_approbation',
      politique_annulation: 'souple',
      regles_maison: 'Respect du voisinage et pas de fete.',
      equipements: JSON.stringify(['Wi-Fi', 'Cuisine equipee', 'Parking']),
    },
    blockedRanges: [],
  },
  {
    title: 'Maison ocre aux portes de Timimoun',
    city: 'Timimoun',
    photos: demoPhotoSets.family,
    form: {
      titre: 'Maison ocre aux portes de Timimoun',
      description:
        'Maison calme proche de la palmeraie avec terrasse, deux chambres et cuisine equipee pour un sejour au sud algerien.',
      type_logement: 'maison',
      adresse: 'Palmeraie de Timimoun, Timimoun',
      ville: 'Timimoun',
      pays: 'Algerie',
      latitude: '29.2639',
      longitude: '0.2306',
      nb_chambres: '2',
      nb_lits: '4',
      nb_salles_de_bain: '1',
      capacite_accueil: '5',
      prix_par_nuit: '5400',
      mode_reservation: 'instantanee',
      politique_annulation: 'souple',
      regles_maison: 'Respect du calme du quartier.',
      equipements: JSON.stringify(['Cuisine equipee', 'Parking', 'Climatisation']),
    },
    blockedRanges: [],
  },
  {
    title: 'Villa saharienne a Djanet',
    city: 'Djanet',
    photos: demoPhotoSets.family,
    form: {
      titre: 'Villa saharienne a Djanet',
      description:
        'Villa familiale avec cour interieure, climatisation et acces rapide aux pistes touristiques autour de Djanet.',
      type_logement: 'villa',
      adresse: 'Quartier Tin Khatma, Djanet',
      ville: 'Djanet',
      pays: 'Algerie',
      latitude: '24.5528',
      longitude: '9.4840',
      nb_chambres: '3',
      nb_lits: '5',
      nb_salles_de_bain: '2',
      capacite_accueil: '6',
      prix_par_nuit: '8300',
      mode_reservation: 'sur_approbation',
      politique_annulation: 'moderee',
      regles_maison: 'Arrivee avant 22h et respect des guides locaux.',
      equipements: JSON.stringify(['Climatisation', 'Parking', 'Cuisine equipee']),
    },
    blockedRanges: [],
  },
  {
    title: 'Studio paisible a Tamanrasset',
    city: 'Tamanrasset',
    photos: demoPhotoSets.urban,
    form: {
      titre: 'Studio paisible a Tamanrasset',
      description:
        'Studio simple et propre pour deux personnes, proche du centre de Tamanrasset avec parking et connexion internet.',
      type_logement: 'appartement',
      adresse: 'Avenue Emir Abdelkader, Tamanrasset',
      ville: 'Tamanrasset',
      pays: 'Algerie',
      latitude: '22.7850',
      longitude: '5.5228',
      nb_chambres: '1',
      nb_lits: '1',
      nb_salles_de_bain: '1',
      capacite_accueil: '2',
      prix_par_nuit: '4700',
      mode_reservation: 'instantanee',
      politique_annulation: 'souple',
      regles_maison: 'Logement non fumeur.',
      equipements: JSON.stringify(['Wi-Fi', 'Parking', 'Climatisation']),
    },
    blockedRanges: [],
  },
  {
    title: 'Riad tranquille a Beni Abbes',
    city: 'Beni Abbes',
    photos: demoPhotoSets.family,
    form: {
      titre: 'Riad tranquille a Beni Abbes',
      description:
        'Maison traditionnelle avec patio, salon familial et stationnement, ideale pour une halte calme pres de la Saoura.',
      type_logement: 'maison',
      adresse: 'Quartier ancien, Beni Abbes',
      ville: 'Beni Abbes',
      pays: 'Algerie',
      latitude: '30.1336',
      longitude: '-2.1669',
      nb_chambres: '3',
      nb_lits: '5',
      nb_salles_de_bain: '2',
      capacite_accueil: '6',
      prix_par_nuit: '6100',
      mode_reservation: 'sur_approbation',
      politique_annulation: 'moderee',
      regles_maison: 'Respect du calme du patio apres 22h.',
      equipements: JSON.stringify(['Cuisine equipee', 'Parking', 'Climatisation']),
    },
    blockedRanges: [],
  },
  {
    title: 'Maison desertique a El Menia',
    city: 'El Menia',
    photos: demoPhotoSets.family,
    form: {
      titre: 'Maison desertique a El Menia',
      description:
        'Logement simple et confortable avec cour ombragee, climatisation et cuisine equipee pour explorer la region.',
      type_logement: 'maison',
      adresse: 'Centre-ville, El Menia',
      ville: 'El Menia',
      pays: 'Algerie',
      latitude: '30.5833',
      longitude: '2.8833',
      nb_chambres: '2',
      nb_lits: '4',
      nb_salles_de_bain: '1',
      capacite_accueil: '5',
      prix_par_nuit: '5600',
      mode_reservation: 'instantanee',
      politique_annulation: 'souple',
      regles_maison: 'Logement non fumeur et arrivee avant 21h.',
      equipements: JSON.stringify(['Cuisine equipee', 'Parking', 'Climatisation']),
    },
    blockedRanges: [],
  },
];

const exchangeListingToSeed = {
  title: 'Duplex calme a Hydra',
  city: 'Alger',
  photos: demoPhotoSets.urban,
  form: {
    titre: 'Duplex calme a Hydra',
    description:
      'Duplex moderne dans un quartier residentiel d Hydra, adapte aux hotes souhaitant organiser un echange de logements.',
    type_logement: 'appartement',
    adresse: 'Hydra, Alger',
    ville: 'Alger',
    pays: 'Algerie',
    latitude: '36.7489',
    longitude: '3.0404',
    nb_chambres: '2',
    nb_lits: '3',
    nb_salles_de_bain: '1',
    capacite_accueil: '4',
    prix_par_nuit: '8500',
    mode_reservation: 'sur_approbation',
    politique_annulation: 'moderee',
    regles_maison: 'Respect du voisinage et pas de fete.',
    equipements: JSON.stringify(['Wi-Fi', 'Cuisine equipee', 'Parking', 'Climatisation']),
  },
  blockedRanges: [],
};

const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';

function shiftDate(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

async function api(path, { method = 'GET', token, body, expectText = false } = {}) {
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = expectText
    ? await response.text()
    : contentType.includes('application/json')
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    const message =
      payload?.erreur ||
      payload?.message ||
      (Array.isArray(payload?.erreurs) ? payload.erreurs.join(', ') : null) ||
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

function tinyPngBlob() {
  return new Blob([Buffer.from(tinyPngBase64, 'base64')], { type: 'image/png' });
}

async function replaceListingPhotos(listingId, photos) {
  const safePhotos = Array.isArray(photos) && photos.length >= 4 ? photos.slice(0, 10) : demoPhotoSets.coastal;
  await db.query('DELETE FROM logement_photo WHERE id_logement = $1', [listingId]);
  for (let index = 0; index < safePhotos.length; index += 1) {
    await db.query(
      'INSERT INTO logement_photo (id_logement, url_photo, ordre_affichage) VALUES ($1, $2, $3)',
      [listingId, safePhotos[index], index]
    );
  }
}

async function deactivateLegacyPresentationListings(keepIds) {
  const ids = keepIds.map((id) => Number(id)).filter(Number.isInteger);
  const legacyTitles = [
    'Appartement lumineux a Bejaia Centre',
    'Appartement vue mer a Bejaia Centre',
    'Villa familiale a Oran',
    'Studio lumineux a Hydra',
    'Maison familiale a Oran Front de Mer',
  ];
  await db.query(
    `
      UPDATE logement
      SET est_actif = FALSE,
          date_mise_a_jour = NOW()
      WHERE est_supprime = FALSE
        AND est_actif = TRUE
        AND (
          titre = ANY($1::text[])
          OR (
            titre = ANY($2::text[])
            AND NOT (id = ANY($3::bigint[]))
          )
        )
    `,
    [
      legacyTitles,
      [...listingsToSeed.map((item) => item.title), exchangeListingToSeed.title],
      ids,
    ]
  );
}

async function ensureUser(kind) {
  const user = demoUsers[kind];

  try {
    const login = await api('/auth/connexion', {
      method: 'POST',
      body: {
        identifier: user.email,
        mot_de_passe: user.password,
      },
    });
    await finalizeUserSeed(login.user.id, kind);
    return login;
  } catch (error) {
    if (!/introuvable|incorrect/i.test(error.message)) {
      throw error;
    }
  }

  const registration = await api('/auth/inscription', {
    method: 'POST',
    body: {
      prenom: user.prenom,
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      mot_de_passe: user.password,
      role_type: kind === 'admin' ? 'voyageur' : user.role_type,
    },
  });

  await finalizeUserSeed(registration.user.id, kind);

  if (kind === 'admin') {
    const login = await api('/auth/connexion', {
      method: 'POST',
      body: {
        identifier: user.email,
        mot_de_passe: user.password,
      },
    });
    return login;
  }

  return registration;
}

async function finalizeUserSeed(userId, kind) {
  const user = demoUsers[kind];

  await db.query(
    `
      UPDATE utilisateur
      SET prenom = $1,
          nom = $2,
          email = $3,
          telephone = $4,
          role_type = $5,
          photo_profil = $6,
          est_verifie = $7,
          verification_niveau = $8,
          statut_compte = 'actif',
          provider_source = 'local',
          bio = $9,
          date_mise_a_jour = NOW()
      WHERE id = $10
    `,
    [
      user.prenom,
      user.nom,
      user.email,
      user.telephone,
      user.role_type,
      user.photo_profil,
      user.role_type !== 'voyageur',
      user.role_type === 'admin' ? 3 : user.role_type === 'hote' ? 2 : 1,
      user.role_type === 'hote'
        ? 'Hote disponible et reactif.'
        : user.role_type === 'voyageur'
          ? 'Voyageur curieux et organise.'
          : 'Compte administrateur de demonstration.',
      userId,
    ]
  );
}

async function ensureListing(hostToken, listingSeed) {
  const listings = await api('/annonces/mes-annonces', { token: hostToken });
  let listing = listings.find((item) => item.titre === listingSeed.title);

  if (!listing) {
    const form = new FormData();
    for (const [key, value] of Object.entries(listingSeed.form)) {
      form.append(key, value);
    }
    for (let index = 0; index < 4; index += 1) {
      form.append('photos', tinyPngBlob(), `${listingSeed.city.toLowerCase()}-${index + 1}.png`);
    }

    const created = await api('/annonces', {
      method: 'POST',
      token: hostToken,
      body: form,
    });
    listing = created.logement;
  }

  await replaceListingPhotos(listing.id, listingSeed.photos);

  await api(`/annonces/${listing.id}/disponibilites`, {
    method: 'PUT',
    token: hostToken,
    body: { disponibilites: listingSeed.blockedRanges },
  });

  const updateForm = new FormData();
  updateForm.append('regles_maison', listingSeed.form.regles_maison);
  updateForm.append('equipements', listingSeed.form.equipements);
  await api(`/annonces/${listing.id}`, {
    method: 'PATCH',
    token: hostToken,
    body: updateForm,
  });

  await replaceListingPhotos(listing.id, listingSeed.photos);
  return api(`/logements/${listing.id}`);
}

async function ensureFavorite(travelerToken, listingId) {
  await api(`/favoris/${listingId}`, { method: 'POST', token: travelerToken });
}

async function ensurePendingReservation(travelerToken, listingId) {
  const myReservations = await api('/reservations/me', { token: travelerToken });
  const existing = myReservations.find(
    (item) => String(item.id_logement) === String(listingId) && item.statut === 'en_attente'
  );

  if (existing) {
    return existing;
  }

  return api('/reservations', {
    method: 'POST',
    token: travelerToken,
    body: {
      id_logement: listingId,
      date_arrivee: shiftDate(7),
      date_depart: shiftDate(10),
      nb_voyageurs: 2,
    },
  });
}

async function ensureCompletedReservation(travelerToken, hostToken, listingId) {
  const myReservations = await api('/reservations/me', { token: travelerToken });
  let existing = myReservations.find(
    (item) => String(item.id_logement) === String(listingId) && item.statut === 'terminee'
  );

  if (existing) {
    return existing;
  }

  const created = await api('/reservations', {
    method: 'POST',
    token: travelerToken,
    body: {
      id_logement: listingId,
      date_arrivee: shiftDate(-15),
      date_depart: shiftDate(-12),
      nb_voyageurs: 2,
    },
  });

  const reservationId = created.id;
  await api(`/reservations/${reservationId}/statut`, {
    method: 'PATCH',
    token: hostToken,
    body: { statut: 'terminee' },
  });

  const refreshed = await api('/reservations/me', { token: travelerToken });
  existing = refreshed.find((item) => item.id === reservationId);
  return existing || created;
}

async function ensureConversationAndMessages(hostToken, travelerToken, hostUserId) {
  const conversation = await api('/messages/conversations', {
    method: 'POST',
    token: travelerToken,
    body: { interlocuteur_id: hostUserId },
  });

  const messages = await api(`/messages/conversation/${conversation.id}`, { token: travelerToken });
  if (messages.length === 0) {
    await api('/messages', {
      method: 'POST',
      token: travelerToken,
      body: {
        id_conversation: conversation.id,
        contenu: 'Bonjour, le logement est-il facile d acces en voiture ?',
      },
    });

    await api('/messages', {
      method: 'POST',
      token: hostToken,
      body: {
        id_conversation: conversation.id,
        contenu: 'Oui, tu as une place de stationnement reservee a l arrivee.',
      },
    });
  }

  const refreshed = await api(`/messages/conversation/${conversation.id}`, { token: travelerToken });
  const hasPhotoMessage = refreshed.some((item) => item.photo_url);
  if (!hasPhotoMessage) {
    const form = new FormData();
    form.append('id_conversation', conversation.id);
    form.append('contenu', 'Je joins une photo pour illustrer ma demande.');
    form.append('photo', tinyPngBlob(), 'message.png');
    await api('/messages/photo', {
      method: 'POST',
      token: travelerToken,
      body: form,
    });
  }

  return conversation;
}

async function ensurePresentationConversations(travelerUserId) {
  const contacts = [
    {
      email: 'amina.presentation@algbnb.local',
      prenom: 'Amina',
      nom: 'Kaci',
      role: 'hote',
      message: 'Bonjour, les dates proposees pour Bejaia sont encore disponibles.',
    },
    {
      email: 'samir.presentation@algbnb.local',
      prenom: 'Samir',
      nom: 'Belaid',
      role: 'hote',
      message: 'Je peux vous envoyer les details du sejour a Timimoun.',
    },
    {
      email: 'sarah.presentation@algbnb.local',
      prenom: 'Sarah',
      nom: 'Mansouri',
      role: 'voyageur',
      message: 'Merci pour votre retour, les informations sont claires.',
    },
    {
      email: 'lyna.presentation@algbnb.local',
      prenom: 'Lyna',
      nom: 'Haddad',
      role: 'hote',
      message: 'Pour l echange, je suis disponible pour discuter des dates.',
    },
  ];

  for (const contact of contacts) {
    const userResult = await db.query(
      `
        INSERT INTO utilisateur (prenom, nom, email, role_type, provider_source, est_verifie, verification_niveau, statut_compte)
        VALUES ($1, $2, $3, $4, 'local', TRUE, 1, 'actif')
        ON CONFLICT (email)
        DO UPDATE SET prenom = EXCLUDED.prenom,
                      nom = EXCLUDED.nom,
                      role_type = EXCLUDED.role_type,
                      statut_compte = 'actif',
                      date_mise_a_jour = NOW()
        RETURNING id
      `,
      [contact.prenom, contact.nom, contact.email, contact.role],
    );
    const contactId = userResult.rows[0].id;
    const [user1, user2] =
      Number(travelerUserId) < Number(contactId)
        ? [travelerUserId, contactId]
        : [contactId, travelerUserId];
    const conversation = await db.query(
      `
        INSERT INTO conversation (id_utilisateur1, id_utilisateur2, date_mise_a_jour)
        VALUES ($1, $2, NOW())
        ON CONFLICT (id_utilisateur1, id_utilisateur2)
        DO UPDATE SET date_mise_a_jour = NOW()
        RETURNING id
      `,
      [user1, user2],
    );
    const existing = await db.query(
      'SELECT id FROM message WHERE id_conversation = $1 AND contenu = $2 LIMIT 1',
      [conversation.rows[0].id, contact.message],
    );
    if (existing.rows.length === 0) {
      await db.query(
        `
          INSERT INTO message (id_conversation, id_expediteur, contenu, est_lu, date_envoi)
          VALUES ($1, $2, $3, FALSE, NOW())
        `,
        [conversation.rows[0].id, contactId, contact.message],
      );
    }
  }
}

async function ensureReview(travelerToken, reservationId) {
  const reservations = await api('/reservations/me', { token: travelerToken });
  const reservation = reservations.find((item) => item.id === reservationId);
  if (reservation?.has_review) {
    return;
  }

  try {
    await api('/avis', {
      method: 'POST',
      token: travelerToken,
      body: {
        id_reservation: reservationId,
        note_logement: 5,
        note_hote: 5,
        commentaire: 'Sejour tres agreable, logement conforme et hote accueillant.',
      },
    });
  } catch (error) {
    if (!/deja/i.test(error.message)) {
      throw error;
    }
  }
}

async function ensureDemoExchange(requesterHostId, receiverHostId, requesterListingId, receiverListingId) {
  await db.query(
    `
      INSERT INTO logement_echange_preference (id_logement, est_ouvert, message, date_mise_a_jour)
      VALUES ($1, TRUE, $2, NOW())
      ON CONFLICT (id_logement)
      DO UPDATE SET est_ouvert = TRUE, message = EXCLUDED.message, date_mise_a_jour = NOW()
    `,
    [receiverListingId, 'Ouvert a un echange flexible entre hotes.']
  );

  let conversation = await db.query(
    `
      SELECT id
      FROM conversation
      WHERE (id_utilisateur1 = $1 AND id_utilisateur2 = $2)
         OR (id_utilisateur1 = $2 AND id_utilisateur2 = $1)
      LIMIT 1
    `,
    [requesterHostId, receiverHostId]
  );

  if (conversation.rows.length === 0) {
    conversation = await db.query(
      `
        INSERT INTO conversation (id_utilisateur1, id_utilisateur2)
        VALUES ($1, $2)
        RETURNING id
      `,
      [requesterHostId, receiverHostId]
    );
  }

  const existing = await db.query(
    `
      SELECT id
      FROM echange_logement
      WHERE id_logement_demandeur = $1
        AND id_logement_receveur = $2
        AND statut IN ('discussion', 'proposee', 'contre_proposee', 'contrepartie_proposee')
      LIMIT 1
    `,
    [requesterListingId, receiverListingId]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const exchange = await db.query(
    `
      INSERT INTO echange_logement (
        id_logement_demandeur, id_logement_receveur,
        id_hote_demandeur, id_hote_receveur,
        id_conversation,
        demandeur_date_debut, demandeur_date_fin,
        receveur_date_debut, receveur_date_fin,
        statut, dernier_acteur_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'contrepartie_proposee', $4)
      RETURNING id
    `,
    [
      requesterListingId,
      receiverListingId,
      requesterHostId,
      receiverHostId,
      conversation.rows[0].id,
      shiftDate(45),
      shiftDate(51),
      shiftDate(63),
      shiftDate(67),
    ]
  );

  await db.query(
    `
      INSERT INTO message (id_conversation, id_expediteur, contenu)
      VALUES
        ($1, $2, 'Bonjour, je suis interesse par un echange de logements cet ete.'),
        ($1, $3, 'Avec plaisir, je propose ces dates pour la contrepartie.')
    `,
    [conversation.rows[0].id, requesterHostId, receiverHostId]
  );

  return exchange.rows[0];
}

async function ensureAdminUser() {
  const existing = await db.query('SELECT id FROM utilisateur WHERE email = $1 LIMIT 1', [
    demoUsers.admin.email,
  ]);

  if (existing.rows.length === 0) {
    await ensureUser('admin');
  } else {
    await finalizeUserSeed(existing.rows[0].id, 'admin');
  }
}

async function ensureResetFlow() {
  const email = 'reset.demo@algbnb.local';
  const originalPassword = 'Reset123!';
  const nextPassword = 'Reset456!';

  try {
    await api('/auth/inscription', {
      method: 'POST',
      body: {
        prenom: 'Reset',
        nom: 'Demo',
        email,
        telephone: '0550000004',
        mot_de_passe: originalPassword,
        role_type: 'voyageur',
      },
    });
  } catch (error) {
    if (!/existe/i.test(error.message)) {
      throw error;
    }
  }

  const forgot = await api('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });

  await api('/auth/reset-password', {
    method: 'POST',
    body: {
      token: forgot.reset_token,
      mot_de_passe: nextPassword,
    },
  });

  await api('/auth/connexion', {
    method: 'POST',
    body: {
      identifier: email,
      mot_de_passe: nextPassword,
    },
  });

  return true;
}

async function ensureDemoDispute(adminToken, travelerId, reservationId) {
  const existing = await api('/admin/litiges', { token: adminToken });
  const found = existing.find((item) => item.sujet === 'Demande de verification de caution');
  if (found) {
    return found;
  }

  return api('/admin/litiges', {
    method: 'POST',
    token: adminToken,
    body: {
      id_reservation: reservationId,
      id_ouverture: travelerId,
      sujet: 'Demande de verification de caution',
      description: 'Le voyageur souhaite confirmer les modalites de caution avant son prochain sejour.',
    },
  });
}

async function main() {
  console.log(`[smoke] base URL: ${BASE_URL}`);

  const hostAuth = await ensureUser('host');
  const exchangeHostAuth = await ensureUser('hostExchange');
  const travelerAuth = await ensureUser('traveler');
  await ensureAdminUser();
  const adminAuth = await api('/auth/connexion', {
    method: 'POST',
    body: {
      identifier: demoUsers.admin.email,
      mot_de_passe: demoUsers.admin.password,
    },
  });

  const hostToken = hostAuth.token;
  const travelerToken = travelerAuth.token;
  const adminToken = adminAuth.token;

  await api('/users/me', { token: travelerToken });
  await api('/users/me', {
    method: 'PATCH',
    token: travelerToken,
    body: {
      nom: demoUsers.traveler.nom,
      prenom: demoUsers.traveler.prenom,
      email: demoUsers.traveler.email,
      telephone: demoUsers.traveler.telephone,
      bio: 'Voyageur curieux et organise.',
    },
  });

  const seededListings = await Promise.all(listingsToSeed.map((listingSeed) => ensureListing(hostToken, listingSeed)));
  const receiverExchangeListing = await ensureListing(exchangeHostAuth.token, exchangeListingToSeed);
  await deactivateLegacyPresentationListings([...seededListings, receiverExchangeListing].map((listing) => listing.id));
  const [listingA, listingB] = seededListings;
  await ensureDemoExchange(hostAuth.user.id, exchangeHostAuth.user.id, listingA.id, receiverExchangeListing.id);

  await ensureFavorite(travelerToken, listingA.id);

  const pendingReservation = await ensurePendingReservation(travelerToken, listingA.id);
  const completedReservation = await ensureCompletedReservation(travelerToken, hostToken, listingB.id);
  await ensureConversationAndMessages(hostToken, travelerToken, hostAuth.user.id);
  await ensurePresentationConversations(travelerAuth.user.id);
  await ensureReview(travelerToken, completedReservation.id);
  await ensureResetFlow();
  await ensureDemoDispute(adminToken, travelerAuth.user.id, pendingReservation.id);

  const [searchResults, hostDashboard, travelerReservations, hostNotifications, travelerNotifications, adminStats] =
    await Promise.all([
      api(`/logements?paginated=true&search=${encodeURIComponent('Bejaia')}&limit=12`),
      api('/dashboard/host/me', { token: hostToken }),
      api('/reservations/me', { token: travelerToken }),
      api('/notifications/summary', { token: hostToken }),
      api('/notifications/summary', { token: travelerToken }),
      api('/admin/stats', { token: adminToken }),
    ]);

  await api('/notifications/read-all', {
    method: 'PATCH',
    token: travelerToken,
    body: {},
  });
  const travelerNotificationsAfterRead = await api('/notifications/summary', { token: travelerToken });
  const remoteSearches = await Promise.all(
    ['Djanet', 'Timimoun', 'Tamanrasset', 'Beni Abbes', 'El Menia', 'El Kseur'].map((place) =>
      api(`/logements?paginated=true&search=${encodeURIComponent(place)}&limit=12`)
    )
  );

  const elKseurSuggestions = await api(`/logements/location-search?q=${encodeURIComponent('el kser')}`);
  const elKseurSuggestion = Array.isArray(elKseurSuggestions)
    ? elKseurSuggestions.find((item) => item.address?.city === 'El Kseur') || elKseurSuggestions[0]
    : null;
  const elKseurGeoSearch = elKseurSuggestion?.boundingbox
    ? await api(`/logements?paginated=true&search=${encodeURIComponent('El Kseur')}&placeLat=${encodeURIComponent(elKseurSuggestion.lat)}&placeLng=${encodeURIComponent(elKseurSuggestion.lon)}&placeMinLat=${encodeURIComponent(elKseurSuggestion.boundingbox[0])}&placeMaxLat=${encodeURIComponent(elKseurSuggestion.boundingbox[1])}&placeMinLng=${encodeURIComponent(elKseurSuggestion.boundingbox[2])}&placeMaxLng=${encodeURIComponent(elKseurSuggestion.boundingbox[3])}&placeLabel=${encodeURIComponent(elKseurSuggestion.display_name)}&limit=12`)
    : { items: [] };

  const summary = {
    host: {
      email: demoUsers.host.email,
      password: demoUsers.host.password,
    },
    traveler: {
      email: demoUsers.traveler.email,
      password: demoUsers.traveler.password,
    },
    admin: {
      email: demoUsers.admin.email,
      password: demoUsers.admin.password,
    },
    listingsSeeded: [...seededListings, receiverExchangeListing].map((listing) => listing.titre),
    pendingReservationStatus: pendingReservation.statut,
    completedReservationStatus:
      travelerReservations.find((item) => item.id === completedReservation.id)?.statut || completedReservation.statut,
    searchResults: Array.isArray(searchResults.items) ? searchResults.items.length : 0,
    remoteSearchResults: remoteSearches.map((result) => (Array.isArray(result.items) ? result.items.length : 0)),
    elKseurSuggestion: elKseurSuggestion?.display_name || null,
    elKseurGeoResults: Array.isArray(elKseurGeoSearch.items) ? elKseurGeoSearch.items.length : 0,
    hostPendingReservations: hostDashboard?.stats?.nb_reservations_en_attente || 0,
    hostUnreadNotifications: hostNotifications?.unread_count || 0,
    travelerUnreadNotificationsBeforeRead: travelerNotifications?.unread_count || 0,
    travelerUnreadNotificationsAfterRead: travelerNotificationsAfterRead?.unread_count || 0,
    adminUsers: adminStats?.nb_utilisateurs || 0,
    resetFlowOk: true,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error('[smoke] failed:', error.message);
    process.exit(1);
  })
  .finally(async () => {
    await db.pool.end().catch(() => null);
  });
