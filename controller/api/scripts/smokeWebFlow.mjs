import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
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

const listingsToSeed = [
  {
    title: '[DEMO] Appartement vue mer a Bejaia',
    city: 'Bejaia',
    form: {
      titre: '[DEMO] Appartement vue mer a Bejaia',
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
      photo_urls: JSON.stringify(['/uploads/logements/demo-vue-mer.svg']),
    },
    blockedRanges: [
      {
        date_debut: shiftDate(18),
        date_fin: shiftDate(20),
        est_bloque: true,
        source_blocage: 'maintenance',
        note_interne: 'Maintenance climatiseur',
      },
    ],
  },
  {
    title: '[DEMO] Loft urbain centre-ville',
    city: 'Alger',
    form: {
      titre: '[DEMO] Loft urbain centre-ville',
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
      photo_urls: JSON.stringify(['/uploads/logements/demo-loft-centre.svg']),
    },
    blockedRanges: [],
  },
];

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
      kind !== 'traveler',
      kind === 'admin' ? 3 : kind === 'host' ? 2 : 1,
      kind === 'host'
        ? 'Hote disponible et reactif.'
        : kind === 'traveler'
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

    const created = await api('/annonces', {
      method: 'POST',
      token: hostToken,
      body: form,
    });
    listing = created.logement;
  }

  await api(`/annonces/${listing.id}/disponibilites`, {
    method: 'PUT',
    token: hostToken,
    body: { disponibilites: listingSeed.blockedRanges },
  });

  const updateForm = new FormData();
  updateForm.append('regles_maison', listingSeed.form.regles_maison);
  updateForm.append('photo_urls', JSON.stringify([listingSeed.form.photo_urls ? JSON.parse(listingSeed.form.photo_urls)[0] : '']));
  updateForm.append('equipements', listingSeed.form.equipements);
  updateForm.append('photos', tinyPngBlob(), 'smoke-update.png');
  await api(`/annonces/${listing.id}`, {
    method: 'PATCH',
    token: hostToken,
    body: updateForm,
  });

  return listing;
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

  const [listingA, listingB] = await Promise.all([
    ensureListing(hostToken, listingsToSeed[0]),
    ensureListing(hostToken, listingsToSeed[1]),
  ]);

  await ensureFavorite(travelerToken, listingA.id);

  const pendingReservation = await ensurePendingReservation(travelerToken, listingA.id);
  const completedReservation = await ensureCompletedReservation(travelerToken, hostToken, listingB.id);
  await ensureConversationAndMessages(hostToken, travelerToken, hostAuth.user.id);
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
    listingsSeeded: [listingA.titre, listingB.titre],
    pendingReservationStatus: pendingReservation.statut,
    completedReservationStatus:
      travelerReservations.find((item) => item.id === completedReservation.id)?.statut || completedReservation.statut,
    searchResults: Array.isArray(searchResults.items) ? searchResults.items.length : 0,
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
