import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../../../model/api/db');

const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:3001/api').replace(/\/$/, '');
const password = 'QaCodex123!';
const tinyPngBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4////fwAJ+wP9KobjigAAAABJRU5ErkJggg==';

const users = {
  host: {
    email: 'qa.codex.hote@algbnb.local',
    telephone: '0599001001',
    prenom: 'QA',
    nom: 'Hote',
    role_type: 'hote',
  },
  host2: {
    email: 'qa.codex.hote2@algbnb.local',
    telephone: '0599001004',
    prenom: 'Nadia',
    nom: 'Benali',
    role_type: 'hote',
  },
  traveler: {
    email: 'qa.codex.voyageur@algbnb.local',
    telephone: '0599001002',
    prenom: 'QA',
    nom: 'Voyageur',
    role_type: 'voyageur',
  },
  admin: {
    email: 'qa.codex.admin@algbnb.local',
    telephone: '0599001003',
    prenom: 'QA',
    nom: 'Admin',
    role_type: 'admin',
  },
};

const results = [];
const createdReservationIds = [];
let qaConversationId = null;
let qaMessageId = null;
let qaReviewId = null;
let qaPaymentReference = null;
let qaExchangeId = null;

const day = (offset) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

const uniqueOffset = () => 365 + (Date.now() % 20000);

const tinyPngBlob = () => new Blob([Buffer.from(tinyPngBase64, 'base64')], { type: 'image/png' });

const validCardPayload = () => ({
  numero_carte: '1234123412341234',
  nom_porteur: 'QA VOYAGEUR',
  date_expiration: '12/30',
  cvv: '123',
});

async function record(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`[ok] ${name}`);
    return detail;
  } catch (error) {
    results.push({ name, ok: false, detail: error.message });
    console.error(`[fail] ${name}: ${error.message}`);
    return null;
  }
}

async function api(path, { method = 'GET', token, body, expectedStatus, allowStatuses = [] } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isFormData) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  const allowed = expectedStatus ? [expectedStatus] : [200, 201, ...allowStatuses];

  if (!allowed.includes(response.status)) {
    const message =
      payload?.erreur ||
      payload?.message ||
      (Array.isArray(payload?.erreurs) ? payload.erreurs.join(', ') : null) ||
      `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function ensureUser(kind) {
  const user = users[kind];
  const hash = await bcrypt.hash(password, 10);
  const verificationLevel = user.role_type === 'admin' ? 3 : user.role_type === 'hote' ? 2 : 1;

  const existing = await db.query('SELECT id FROM utilisateur WHERE email = $1 LIMIT 1', [user.email]);
  if (existing.rows.length === 0) {
    await api('/auth/inscription', {
      method: 'POST',
      body: {
        prenom: user.prenom,
        nom: user.nom,
        email: user.email,
        telephone: user.telephone,
        mot_de_passe: password,
        role_type: user.role_type === 'admin' ? 'voyageur' : user.role_type,
      },
    });
  }

  await db.query(
    `
      UPDATE utilisateur
      SET prenom = $1,
          nom = $2,
          email = $3,
          telephone = $4,
          role_type = $5,
          mot_de_passe = $6,
          statut_compte = 'actif',
          provider_source = 'local',
          est_verifie = TRUE,
          verification_niveau = $7,
          date_mise_a_jour = NOW()
      WHERE email = $3
    `,
    [user.prenom, user.nom, user.email, user.telephone, user.role_type, hash, verificationLevel],
  );

  return api('/auth/connexion', {
    method: 'POST',
    body: { identifier: user.email, mot_de_passe: password },
  });
}

async function ensureListing(hostToken, title, overrides = {}) {
  const listings = await api('/annonces/mes-annonces', { token: hostToken });
  const existing = listings.find((item) => item.titre === title);
  if (existing) {
    const detail = await api(`/annonces/${existing.id}`, { token: hostToken });
    if (!Array.isArray(detail.photos) || detail.photos.length < 4) {
      const photoForm = new FormData();
      for (let index = 0; index < 4; index += 1) {
        photoForm.append(
          'photos',
          tinyPngBlob(),
          `${title.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}-repair-${index + 1}.png`
        );
      }
      await api(`/annonces/${existing.id}`, { method: 'PATCH', token: hostToken, body: photoForm });
      return api(`/annonces/${existing.id}`, { token: hostToken });
    }
    return detail;
  }

  const form = new FormData();
  const payload = {
    titre: title,
    description: overrides.description || 'Annonce QA GEO generee par Codex pour verifier tous les parcours web et API du site.',
    type_logement: overrides.type_logement || 'appartement',
    adresse: overrides.adresse || 'Rue de la Liberte, Bejaia',
    ville: overrides.ville || 'Bejaia',
    pays: 'Algerie',
    latitude: overrides.latitude || '36.7518000',
    longitude: overrides.longitude || '5.0567000',
    nb_chambres: overrides.nb_chambres || '2',
    nb_lits: overrides.nb_lits || '3',
    nb_salles_de_bain: '1',
    capacite_accueil: overrides.capacite_accueil || '4',
    prix_par_nuit: overrides.prix_par_nuit || '6500',
    mode_reservation: overrides.mode_reservation || 'instantanee',
    politique_annulation: 'moderee',
    regles_maison: 'Respect du voisinage et pas de fete.',
    compte_ccp: overrides.compte_ccp || '1234567890',
    equipements: JSON.stringify(['Wi-Fi', 'Cuisine equipee', 'Parking']),
  };

  for (const [key, value] of Object.entries(payload)) {
    form.append(key, value);
  }
  for (let index = 0; index < 4; index += 1) {
    form.append('photos', tinyPngBlob(), `${title.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}-${index + 1}.png`);
  }

  const created = await api('/annonces', { method: 'POST', token: hostToken, body: form });
  return created.logement;
}

function listingForm(title, overrides = {}, photoCount = 4) {
  const form = new FormData();
  const payload = {
    titre: title,
    description: overrides.description || 'Annonce QA GEO valide pour verifier les regles de photos et le backend.',
    type_logement: overrides.type_logement || 'appartement',
    adresse: overrides.adresse || 'Rue de la Liberte, Bejaia',
    ville: overrides.ville || 'Bejaia',
    pays: 'Algerie',
    latitude: overrides.latitude || '36.7518000',
    longitude: overrides.longitude || '5.0567000',
    nb_chambres: overrides.nb_chambres || '2',
    nb_lits: overrides.nb_lits || '3',
    nb_salles_de_bain: overrides.nb_salles_de_bain || '1',
    capacite_accueil: overrides.capacite_accueil || '4',
    prix_par_nuit: overrides.prix_par_nuit || '6500',
    mode_reservation: overrides.mode_reservation || 'instantanee',
    politique_annulation: 'moderee',
    regles_maison: 'Respect du voisinage.',
    compte_ccp: '1234567890',
    equipements: JSON.stringify(['Wi-Fi', 'Cuisine equipee', 'Parking']),
  };
  Object.entries(payload).forEach(([key, value]) => form.append(key, value));
  for (let index = 0; index < photoCount; index += 1) {
    form.append('photos', tinyPngBlob(), `${title.replace(/[^a-z0-9]+/gi, '-').slice(0, 35)}-${index + 1}.png`);
  }
  return form;
}

async function createReservation(token, listingId, startOffset, voyageurs = 2) {
  const reservation = await api('/reservations', {
    method: 'POST',
    token,
    body: {
      id_logement: listingId,
      date_arrivee: day(startOffset),
      date_depart: day(startOffset + 3),
      nb_voyageurs: voyageurs,
    },
  });
  createdReservationIds.push(reservation.id);
  return reservation;
}

async function resetQaListingState(listingIds) {
  const ids = listingIds.map((id) => Number(id)).filter(Number.isInteger);
  if (ids.length === 0) return;

  await db.query(
    `
      UPDATE echange_logement
      SET statut = 'annulee',
          date_decision = NOW()
      WHERE statut IN ('discussion', 'proposee', 'contre_proposee', 'contrepartie_proposee')
        AND (id_logement_demandeur = ANY($1::int[]) OR id_logement_receveur = ANY($1::int[]))
    `,
    [ids]
  );

  await db.query(
    `
      UPDATE reservation
      SET statut = 'annulee_admin',
          date_annulation = NOW(),
          motif_annulation = 'Nettoyage QA automatique'
      WHERE id_logement = ANY($1::int[])
        AND statut IN ('en_attente', 'confirmee', 'terminee')
    `,
    [ids]
  );

  await db.query(
    `
      DELETE FROM disponibilite
      WHERE id_logement = ANY($1::int[])
        AND source_blocage IN ('manuel', 'reservation', 'echange')
    `,
    [ids]
  );
}

async function main() {
  console.log(`[qa] base URL: ${BASE_URL}`);

  await record('health', () => api('/health'));
  const host = await record('auth hote QA', () => ensureUser('host'));
  const host2 = await record('auth hote secondaire', () => ensureUser('host2'));
  const traveler = await record('auth voyageur QA', () => ensureUser('traveler'));
  const admin = await record('auth admin QA', () => ensureUser('admin'));

  if (!host || !host2 || !traveler || !admin) {
    throw new Error('Impossible de preparer les comptes QA.');
  }

  await record('inscription doublon affiche 409', () =>
    api('/auth/inscription', {
      method: 'POST',
      expectedStatus: 409,
      body: {
        prenom: users.traveler.prenom,
        nom: users.traveler.nom,
        email: users.traveler.email,
        telephone: users.traveler.telephone,
        mot_de_passe: password,
        role_type: 'voyageur',
      },
    }));

  await record('providers auth google uniquement', async () => {
    const providerStatus = await api('/auth/providers');
    if (!Object.prototype.hasOwnProperty.call(providerStatus, 'google')) {
      throw new Error('Provider Google absent.');
    }
    if (Object.prototype.hasOwnProperty.call(providerStatus, 'facebook')) {
      throw new Error('Provider Facebook encore visible.');
    }
    return providerStatus;
  });
  await record('profil voyageur get', () => api('/users/me', { token: traveler.token }));
  await record('profil voyageur patch', () =>
    api('/users/me', {
      method: 'PATCH',
      token: traveler.token,
      body: { nom: users.traveler.nom, prenom: users.traveler.prenom, email: users.traveler.email, telephone: users.traveler.telephone, bio: 'Compte QA Codex.' },
    }));

  const instantListing = await record('annonce QA instantanee', () =>
    ensureListing(host.token, '[QA GEO] Bejaia Centre Terrasse', { mode_reservation: 'instantanee' }));
  const approvalListing = await record('annonce QA sur approbation', () =>
    ensureListing(host.token, '[QA GEO] Bejaia Sidi Ahmed Familial', {
      mode_reservation: 'sur_approbation',
      adresse: 'Sidi Ahmed, Bejaia',
      latitude: '36.7584000',
      longitude: '5.0405000',
      capacite_accueil: '5',
      prix_par_nuit: '7200',
    }));
  const exchangeListing = await record('annonce hote secondaire pour echange', () =>
    ensureListing(host2.token, '[QA GEO] Alger Hydra Echange', {
      mode_reservation: 'sur_approbation',
      adresse: 'Hydra, Alger',
      ville: 'Alger',
      latitude: '36.7489000',
      longitude: '3.0404000',
      capacite_accueil: '3',
      prix_par_nuit: '9000',
    }));

  if (!instantListing || !approvalListing || !exchangeListing) {
    throw new Error('Impossible de preparer les annonces QA.');
  }

  await resetQaListingState([instantListing.id, approvalListing.id, exchangeListing.id]);

  await record('annonce accepte minimum quatre photos upload', async () => {
    const detail = await api(`/logements/${instantListing.id}`);
    if (!Array.isArray(detail.photos) || detail.photos.length < 4) {
      throw new Error(`Minimum 4 photos absent: ${detail.photos?.length || 0}`);
    }
    return { photos: detail.photos.length };
  });
  await record('annonce refuse une photo', () =>
    api('/annonces', {
      method: 'POST',
      token: host.token,
      expectedStatus: 400,
      body: listingForm('[QA GEO] Une Photo Refusee', { latitude: '36.7521000', longitude: '5.0569000' }, 1),
    }));
  await record('annonce refuse deux photos', () =>
    api('/annonces', {
      method: 'POST',
      token: host.token,
      expectedStatus: 400,
      body: listingForm('[QA GEO] Deux Photos Refusees', { latitude: '36.7522000', longitude: '5.0570000' }, 2),
    }));
  await record('annonce refuse trois photos', () =>
    api('/annonces', {
      method: 'POST',
      token: host.token,
      expectedStatus: 400,
      body: listingForm('[QA GEO] Trois Photos Refusees', { latitude: '36.7523000', longitude: '5.0571000' }, 3),
    }));
  await record('annonce accepte quatre photos', async () => {
    const created = await api('/annonces', {
      method: 'POST',
      token: host.token,
      body: listingForm('[QA GEO] Quatre Photos Acceptees', { latitude: '36.7524000', longitude: '5.0572000' }, 4),
    });
    if (!Array.isArray(created.logement?.photos) || created.logement.photos.length !== 4) {
      throw new Error(`Photos creees invalides: ${created.logement?.photos?.length || 0}`);
    }
    return { photos: created.logement.photos.length };
  });
  await record('annonce accepte dix photos', async () => {
    const created = await api('/annonces', {
      method: 'POST',
      token: host.token,
      body: listingForm('[QA GEO] Dix Photos Acceptees', { latitude: '36.7525000', longitude: '5.0573000' }, 10),
    });
    if (!Array.isArray(created.logement?.photos) || created.logement.photos.length !== 10) {
      throw new Error(`Photos creees invalides: ${created.logement?.photos?.length || 0}`);
    }
    return { photos: created.logement.photos.length };
  });
  await record('annonce refuse onze photos', () =>
    api('/annonces', {
      method: 'POST',
      token: host.token,
      expectedStatus: 400,
      body: listingForm('[QA GEO] Onze Photos Refusees', { latitude: '36.7526000', longitude: '5.0574000' }, 11),
    }));

  await record('annonce invalide retourne erreurs detaillees', () => {
    const form = new FormData();
    form.append('titre', 'QA');
    form.append('description', 'Court');
    form.append('type_logement', 'appartement');
    form.append('adresse', 'Bejaia');
    form.append('ville', '');
    form.append('nb_chambres', '-1');
    form.append('nb_lits', '0');
    form.append('nb_salles_de_bain', '0');
    form.append('capacite_accueil', '0');
    form.append('prix_par_nuit', '0');
    return api('/annonces', { method: 'POST', token: host.token, body: form, expectedStatus: 400 });
  });

  await record('annonce refuse urls images cote backend', () => {
    const form = new FormData();
    const payload = {
      titre: '[QA GEO] URLs images refusees',
      description: 'Annonce QA valide sauf pour verifier que les URLs images ne sont plus acceptees.',
      type_logement: 'appartement',
      adresse: 'Rue de la Liberte, Bejaia',
      ville: 'Bejaia',
      pays: 'Algerie',
      latitude: '36.7518000',
      longitude: '5.0567000',
      nb_chambres: '1',
      nb_lits: '1',
      nb_salles_de_bain: '1',
      capacite_accueil: '2',
      prix_par_nuit: '5500',
      mode_reservation: 'instantanee',
      politique_annulation: 'moderee',
      equipements: JSON.stringify(['Wi-Fi']),
      photo_urls: JSON.stringify(['https://example.invalid/photo-refusee.jpg']),
    };
    Object.entries(payload).forEach(([key, value]) => form.append(key, value));
    return api('/annonces', { method: 'POST', token: host.token, body: form, expectedStatus: 400 });
  });

  await record('annonce refuse ville et coordonnees incoherentes', async () => {
    const form = new FormData();
    const payload = {
      titre: '[QA GEO INVALID] Bejaia point Alger',
      description: 'Annonce QA volontairement incoherente pour verifier que le backend refuse ville et coordonnees incompatibles.',
      type_logement: 'appartement',
      adresse: 'Adresse test a Bejaia',
      ville: 'Bejaia',
      pays: 'Algerie',
      latitude: '36.7538000',
      longitude: '3.0588000',
      nb_chambres: '1',
      nb_lits: '1',
      nb_salles_de_bain: '1',
      capacite_accueil: '2',
      prix_par_nuit: '5500',
      mode_reservation: 'instantanee',
      politique_annulation: 'moderee',
      regles_maison: 'QA',
      equipements: JSON.stringify(['Wi-Fi']),
    };
    Object.entries(payload).forEach(([key, value]) => form.append(key, value));
    for (let index = 0; index < 4; index += 1) {
      form.append('photos', tinyPngBlob(), `qa-invalid-location-${index + 1}.png`);
    }
    const response = await api('/annonces', { method: 'POST', token: host.token, body: form, expectedStatus: 400 });
    const message = Array.isArray(response.erreurs) ? response.erreurs.join(' ') : JSON.stringify(response);
    if (!message.includes('ne correspond pas')) {
      throw new Error(`Message incoherence manquant: ${message}`);
    }
    return message;
  });

  await record('disponibilites hote', () =>
    api(`/annonces/${approvalListing.id}/disponibilites`, {
      method: 'PUT',
      token: host.token,
      body: {
        disponibilites: [
          { date_debut: day(20), date_fin: day(22), est_bloque: true, source_blocage: 'manuel', note_interne: 'QA blocage' },
        ],
      },
    }));
  await record('blocage hote refuse chevauchement interne', () =>
    api(`/annonces/${approvalListing.id}/disponibilites`, {
      method: 'PUT',
      token: host.token,
      expectedStatus: 400,
      body: {
        disponibilites: [
          { date_debut: day(24), date_fin: day(26), est_bloque: true, source_blocage: 'manuel', note_interne: 'QA A' },
          { date_debut: day(25), date_fin: day(27), est_bloque: true, source_blocage: 'manuel', note_interne: 'QA B' },
        ],
      },
    }));
  await record('reservation refuse plage bloquee', () =>
    api('/reservations', {
      method: 'POST',
      token: traveler.token,
      expectedStatus: 400,
      body: {
        id_logement: approvalListing.id,
        date_arrivee: day(21),
        date_depart: day(23),
        nb_voyageurs: 2,
      },
    }));
  await record('reservation refuse date depart avant arrivee', () =>
    api('/reservations', {
      method: 'POST',
      token: traveler.token,
      expectedStatus: 400,
      body: {
        id_logement: instantListing.id,
        date_arrivee: day(32),
        date_depart: day(31),
        nb_voyageurs: 2,
      },
    }));
  await record('reservation refuse capacite depassee', () =>
    api('/reservations', {
      method: 'POST',
      token: traveler.token,
      expectedStatus: 400,
      body: {
        id_logement: instantListing.id,
        date_arrivee: day(34),
        date_depart: day(36),
        nb_voyageurs: 99,
      },
    }));
  await record('reservation refuse au hote', () =>
    api('/reservations', {
      method: 'POST',
      token: host.token,
      expectedStatus: 403,
      body: {
        id_logement: instantListing.id,
        date_arrivee: day(38),
        date_depart: day(40),
        nb_voyageurs: 2,
      },
    }));
  await record('reservation refuse a admin', () =>
    api('/reservations', {
      method: 'POST',
      token: admin.token,
      expectedStatus: 403,
      body: {
        id_logement: instantListing.id,
        date_arrivee: day(42),
        date_depart: day(44),
        nb_voyageurs: 2,
      },
    }));
  await record('dashboard hote', () => api('/dashboard/host/me', { token: host.token }));
  await record('recherche publique', () => api('/logements?paginated=true&search=Bejaia&limit=12'));
  await record('detail logement', () => api(`/logements/${instantListing.id}`));
  await record('favori ajouter', () => api(`/favoris/${instantListing.id}`, { method: 'POST', token: traveler.token }));
  await record('favoris liste', async () => {
    const list = await api('/favoris', { token: traveler.token });
    if (!Array.isArray(list)) throw new Error('La liste favoris doit etre un tableau.');
    return { count: list.length };
  });
  await record('favori supprimer', () => api(`/favoris/${instantListing.id}`, { method: 'DELETE', token: traveler.token }));

  const baseOffset = uniqueOffset();

  await record('echange refuse au voyageur', () =>
    api(`/echanges/logements/${instantListing.id}/preference`, {
      method: 'PATCH',
      token: traveler.token,
      expectedStatus: 403,
      body: { est_ouvert: true },
    }));
  await record('hote ouvre logement a l echange', () =>
    api(`/echanges/logements/${exchangeListing.id}/preference`, {
      method: 'PATCH',
      token: host2.token,
      body: { est_ouvert: true, message: 'Ouvert a un echange entre hotes pour une demonstration.' },
    }));
  await record('logements ouverts a l echange', async () => {
    const rows = await api('/echanges/logements-ouverts', { token: host.token });
    if (!rows.some((item) => Number(item.id) === Number(exchangeListing.id))) {
      throw new Error('Logement ouvert a l echange absent de la liste.');
    }
    return { count: rows.length };
  });
  const exchange = await record('hote cree demande echange', () =>
    api('/echanges', {
      method: 'POST',
      token: host.token,
      body: {
        id_logement_demandeur: instantListing.id,
        id_logement_receveur: exchangeListing.id,
        message: 'Bonjour, je souhaite tester un echange structure.',
      },
    }));
  qaExchangeId = exchange?.id || null;
  if (exchange) {
    await record('hote demandeur propose dates echange', () =>
      api(`/echanges/${exchange.id}/proposition-demandeur`, {
        method: 'PATCH',
        token: host.token,
        body: {
          demandeur_date_debut: day(baseOffset + 30),
          demandeur_date_fin: day(baseOffset + 33),
        },
      }));
    await record('hote receveur propose contrepartie', () =>
      api(`/echanges/${exchange.id}/reponse-receveur`, {
        method: 'PATCH',
        token: host2.token,
        body: {
          decision: 'accepter',
          receveur_date_debut: day(baseOffset + 40),
          receveur_date_fin: day(baseOffset + 42),
        },
      }));
    await record('hote demandeur accepte echange final', async () => {
      const accepted = await api(`/echanges/${exchange.id}/decision-finale`, {
        method: 'PATCH',
        token: host.token,
        body: { decision: 'accepter' },
      });
      if (accepted.statut !== 'acceptee') throw new Error('Echange non accepte.');
      const blocks = await db.query(
        `
          SELECT COUNT(*)::int AS count
          FROM disponibilite
          WHERE source_blocage = 'echange'
            AND note_interne = $1
        `,
        [`Echange de logements #${exchange.id}`],
      );
      if (blocks.rows[0]?.count !== 2) throw new Error('Les deux calendriers ne sont pas bloques.');
      return accepted;
    });
    await record('mes echanges hote', async () => {
      const rows = await api('/echanges/me', { token: host.token });
      if (!rows.some((item) => Number(item.id) === Number(exchange.id))) {
        throw new Error('Echange absent de la liste hote.');
      }
      return { count: rows.length };
    });

    const counterExchange = await record('hote cree demande echange contre-proposition', () =>
      api('/echanges', {
        method: 'POST',
        token: host.token,
        body: {
          id_logement_demandeur: instantListing.id,
          id_logement_receveur: exchangeListing.id,
          message: 'Bonjour, je souhaite tester une contre-proposition.',
        },
      }));
    if (counterExchange) {
      await record('demandeur propose dates avant contre-proposition', () =>
        api(`/echanges/${counterExchange.id}/proposition-demandeur`, {
          method: 'PATCH',
          token: host.token,
          body: {
            demandeur_date_debut: '2026-09-10',
            demandeur_date_fin: '2026-09-20',
          },
        }));
      await record('receveur envoie contre-proposition', async () => {
        const updated = await api(`/echanges/${counterExchange.id}/reponse-receveur`, {
          method: 'PATCH',
          token: host2.token,
          body: {
            decision: 'contre_proposer',
            demandeur_date_debut: '2026-09-10',
            demandeur_date_fin: '2026-09-20',
            receveur_date_debut: '2026-09-22',
            receveur_date_fin: '2026-09-26',
          },
        });
        if (updated.statut !== 'contre_proposee') throw new Error('Statut contre-proposition absent.');
        return updated;
      });
      await record('demandeur accepte contre-proposition finale', async () => {
        const accepted = await api(`/echanges/${counterExchange.id}/decision-finale`, {
          method: 'PATCH',
          token: host.token,
          body: { decision: 'accepter' },
        });
        if (accepted.statut !== 'acceptee') throw new Error('Contre-proposition non acceptee.');
        const blocks = await db.query(
          `
            SELECT id_logement, date_debut::text, date_fin::text
            FROM disponibilite
            WHERE source_blocage = 'echange'
              AND note_interne = $1
            ORDER BY id_logement
          `,
          [`Echange de logements #${counterExchange.id}`],
        );
        const hasRequesterStay = blocks.rows.some(
          (row) =>
            Number(row.id_logement) === Number(exchangeListing.id) &&
            row.date_debut === '2026-09-10' &&
            row.date_fin === '2026-09-20',
        );
        const hasReceiverStay = blocks.rows.some(
          (row) =>
            Number(row.id_logement) === Number(instantListing.id) &&
            row.date_debut === '2026-09-22' &&
            row.date_fin === '2026-09-26',
        );
        if (!hasRequesterStay || !hasReceiverStay) {
          throw new Error('Les deux periodes independantes ne sont pas bloquees correctement.');
        }
        return accepted;
      });
    }

    const refusalExchange = await record('hote cree demande echange refus motif', () =>
      api('/echanges', {
        method: 'POST',
        token: host.token,
        body: {
          id_logement_demandeur: instantListing.id,
          id_logement_receveur: exchangeListing.id,
          message: 'Bonjour, je souhaite tester le refus motive.',
        },
      }));
    if (refusalExchange) {
      await record('demandeur propose dates avant refus', () =>
        api(`/echanges/${refusalExchange.id}/proposition-demandeur`, {
          method: 'PATCH',
          token: host.token,
          body: {
            demandeur_date_debut: day(baseOffset + 110),
            demandeur_date_fin: day(baseOffset + 113),
          },
        }));
      await record('refus echange exige motif', () =>
        api(`/echanges/${refusalExchange.id}/reponse-receveur`, {
          method: 'PATCH',
          token: host2.token,
          expectedStatus: 400,
          body: { decision: 'refuser' },
        }));
      await record('receveur refuse avec motif visible', async () => {
        const refused = await api(`/echanges/${refusalExchange.id}/reponse-receveur`, {
          method: 'PATCH',
          token: host2.token,
          body: {
            decision: 'refuser',
            motif_refus: 'Dates incompatibles avec une contrainte personnelle.',
          },
        });
        if (refused.statut !== 'refusee' || !refused.motif_refus) {
          throw new Error('Refus motive non conserve.');
        }
        return refused;
      });
    }
  }

  const instantReservation = await record('reservation instantanee avant paiement', () =>
    createReservation(traveler.token, instantListing.id, baseOffset));
  const pendingReservation = await record('reservation approbation en attente', () =>
    createReservation(traveler.token, approvalListing.id, baseOffset + 10));

  if (instantReservation) {
    await record('paiement refuse au hote non voyageur', () =>
      api(`/paiements/reservation/${instantReservation.id}`, {
        method: 'POST',
        token: host.token,
        expectedStatus: 403,
        body: validCardPayload(),
      }));
    await record('paiement refuse a admin non voyageur', () =>
      api(`/paiements/reservation/${instantReservation.id}`, {
        method: 'POST',
        token: admin.token,
        expectedStatus: 403,
        body: validCardPayload(),
      }));
    await record('reservations voyageur refusees au hote', () =>
      api(`/reservations/voyageur/${traveler.user.id}`, { token: host.token, expectedStatus: 403 }));
    await record('reservations voyageur visibles admin', async () => {
      const rows = await api(`/reservations/voyageur/${traveler.user.id}`, { token: admin.token });
      if (!Array.isArray(rows)) throw new Error('Liste reservations admin invalide.');
      return { count: rows.length };
    });
    await record('reservation doublon refuse meme periode', () =>
      api('/reservations', {
        method: 'POST',
        token: traveler.token,
        allowStatuses: [400, 409],
        body: {
          id_logement: instantListing.id,
          date_arrivee: day(baseOffset),
          date_depart: day(baseOffset + 3),
          nb_voyageurs: 2,
        },
      }));
  }

  if (pendingReservation) {
    await record('annulation reservation refusee hote tiers', () =>
      api(`/reservations/${pendingReservation.id}/annuler`, {
        method: 'PATCH',
        token: host2.token,
        expectedStatus: 403,
        body: { motif_annulation: 'Tentative hote tiers QA.' },
      }));
    await record('hote confirme reservation', () =>
      api(`/reservations/${pendingReservation.id}/statut`, {
        method: 'PATCH',
        token: host.token,
        body: { statut: 'confirmee' },
      }));
  }

  if (instantReservation) {
    const payment = await record('paiement dahabiya sandbox', () =>
      api(`/paiements/reservation/${instantReservation.id}`, {
        method: 'POST',
        token: traveler.token,
        body: validCardPayload(),
      }));
    qaPaymentReference = payment?.reference || null;
    await record('paiement dahabiya idempotent', async () => {
      const replay = await api(`/paiements/reservation/${instantReservation.id}`, {
        method: 'POST',
        token: traveler.token,
        body: validCardPayload(),
      });
      if (qaPaymentReference && replay.reference !== qaPaymentReference) {
        throw new Error(`Reference paiement changee: ${qaPaymentReference} -> ${replay.reference}`);
      }
      return { reference: replay.reference };
    });
    await record('paiement reservation consulte', () =>
      api(`/paiements/reservation/${instantReservation.id}`, { token: traveler.token }));

    const cancelReservation = await record('reservation payee pour annulation admin', () =>
      createReservation(traveler.token, instantListing.id, baseOffset + 140));
    if (cancelReservation) {
      await record('paiement reservation annulation admin', () =>
        api(`/paiements/reservation/${cancelReservation.id}`, {
          method: 'POST',
          token: traveler.token,
          body: validCardPayload(),
        }));
      await record('admin annule et remboursement sandbox', async () => {
        await api(`/admin/reservations/${cancelReservation.id}/status`, {
          method: 'PATCH',
          token: admin.token,
          body: {
            statut: 'annulee_admin',
            note: 'QA annulation admin avec remboursement sandbox.',
          },
        });
        const payment = await db.query('SELECT statut FROM paiement WHERE id_reservation = $1', [cancelReservation.id]);
        if (payment.rows[0]?.statut !== 'rembourse') {
          throw new Error('Paiement non rembourse apres annulation admin.');
        }
        return { paiement: payment.rows[0].statut };
      });
    }

    if (pendingReservation) {
      await record('avis refuse avant sejour termine', () =>
        api('/avis', {
          method: 'POST',
          token: traveler.token,
          expectedStatus: 409,
          body: {
            id_reservation: pendingReservation.id,
            note_logement: 4,
            note_hote: 4,
            commentaire: 'Cet avis doit etre refuse car le sejour nest pas termine.',
          },
        }));
    }
    await record('hote termine reservation', () =>
      api(`/reservations/${instantReservation.id}/statut`, {
        method: 'PATCH',
        token: host.token,
        body: { statut: 'terminee' },
      }));
    const review = await record('avis voyageur', () =>
      api('/avis', {
        method: 'POST',
        token: traveler.token,
        body: {
          id_reservation: instantReservation.id,
          note_logement: 5,
          note_hote: 5,
          commentaire: 'Avis QA Codex pour verifier le parcours.',
        },
      }));
    qaReviewId = review?.id || null;
    await record('avis doublon refuse', () =>
      api('/avis', {
        method: 'POST',
        token: traveler.token,
        expectedStatus: 409,
        body: {
          id_reservation: instantReservation.id,
          note_logement: 5,
          note_hote: 5,
          commentaire: 'Deuxieme avis qui doit etre refuse.',
        },
      }));
  }

  await record('reservations voyageur', () => api('/reservations/me', { token: traveler.token }));
  await record('conversation avec hote', async () => {
    const conversation = await api('/messages/conversations', {
      method: 'POST',
      token: traveler.token,
      body: { interlocuteur_id: host.user.id },
    });
    qaConversationId = conversation.id;
    const message = await api('/messages', {
      method: 'POST',
      token: traveler.token,
      body: { id_conversation: conversation.id, contenu: 'Message QA Codex.' },
    });
    qaMessageId = message.id;
    return api(`/messages/conversation/${conversation.id}`, { token: traveler.token });
  });
  await record('admin refuse au voyageur', () => api('/admin/stats', { token: traveler.token, expectedStatus: 403 }));
  await record('dashboard hote refuse au voyageur', () =>
    api('/dashboard/host/me', { token: traveler.token, expectedStatus: 403 }));
  await record('notifications summary', () => api('/notifications/summary', { token: traveler.token }));
  await record('notifications liste', () => api('/notifications?limit=50', { token: traveler.token }));
  await record('notifications tout lire', () => api('/notifications/read-all', { method: 'PATCH', token: traveler.token, body: {} }));
  await record('admin stats', () => api('/admin/stats', { token: admin.token }));
  await record('admin users', () => api('/admin/users', { token: admin.token }));
  await record('admin annonces', () => api('/admin/annonces', { token: admin.token }));
  await record('admin reservations', async () => {
    const rows = await api('/admin/reservations', { token: admin.token });
    const qaReservationIds = createdReservationIds.map(Number);
    if (!rows.some((item) => qaReservationIds.includes(Number(item.id)))) {
      throw new Error('Reservations QA absentes de la console admin.');
    }
    return { count: rows.length };
  });
  await record('admin echanges lecture seule', async () => {
    const rows = await api('/admin/echanges', { token: admin.token });
    if (qaExchangeId && !rows.some((item) => Number(item.id) === Number(qaExchangeId))) {
      throw new Error('Echange QA absent de la console admin.');
    }
    return { count: rows.length };
  });
  await record('admin conversations', async () => {
    const rows = await api('/admin/conversations', { token: admin.token });
    if (qaConversationId && !rows.some((item) => Number(item.conversation_id) === Number(qaConversationId))) {
      throw new Error('Conversation QA absente de la console admin.');
    }
    return { count: rows.length };
  });
  if (qaConversationId) {
    await record('admin messages conversation', async () => {
      const rows = await api(`/admin/conversations/${qaConversationId}/messages`, { token: admin.token });
      if (qaMessageId && !rows.some((item) => Number(item.id) === Number(qaMessageId))) {
        throw new Error('Message QA absent de la lecture admin.');
      }
      return { count: rows.length };
    });
  }
  if (qaMessageId && qaConversationId) {
    await record('admin masque message et voyageur voit placeholder', async () => {
      await api(`/admin/messages/${qaMessageId}/visibility`, {
        method: 'PATCH',
        token: admin.token,
        body: { est_visible: false, note: 'QA moderation message masque.' },
      });
      const travelerMessages = await api(`/messages/conversation/${qaConversationId}`, { token: traveler.token });
      const hidden = travelerMessages.find((item) => Number(item.id) === Number(qaMessageId));
      if (!hidden || hidden.est_visible !== false || !String(hidden.contenu || '').includes('moderation')) {
        throw new Error('Le message masque nest pas remplace correctement cote voyageur.');
      }
      const dbRow = await db.query('SELECT est_visible, moderation_note FROM message WHERE id = $1', [qaMessageId]);
      if (dbRow.rows[0]?.est_visible !== false) throw new Error('Message non masque en base.');
      return hidden.contenu;
    });
    await record('admin restaure message', async () => {
      await api(`/admin/messages/${qaMessageId}/visibility`, {
        method: 'PATCH',
        token: admin.token,
        body: { est_visible: true, note: 'QA restauration message.' },
      });
      const dbRow = await db.query('SELECT est_visible FROM message WHERE id = $1', [qaMessageId]);
      if (dbRow.rows[0]?.est_visible !== true) throw new Error('Message non restaure en base.');
      return { visible: true };
    });
  }
  await record('admin avis', async () => {
    const rows = await api('/admin/avis', { token: admin.token });
    if (qaReviewId && !rows.some((item) => Number(item.id) === Number(qaReviewId))) {
      throw new Error('Avis QA absent de la console admin.');
    }
    return { count: rows.length };
  });
  if (qaReviewId) {
    await record('admin masque avis et public ne le voit plus', async () => {
      await api(`/admin/avis/${qaReviewId}/visibility`, {
        method: 'PATCH',
        token: admin.token,
        body: { est_visible: false, note: 'QA moderation avis masque.' },
      });
      const publicReviews = await api(`/avis/logement/${instantListing.id}`);
      if (publicReviews.some((item) => Number(item.id) === Number(qaReviewId))) {
        throw new Error('Avis masque encore visible publiquement.');
      }
      const dbRow = await db.query('SELECT est_visible FROM avis WHERE id = $1', [qaReviewId]);
      if (dbRow.rows[0]?.est_visible !== false) throw new Error('Avis non masque en base.');
      return { visiblePublic: false };
    });
    await record('admin restaure avis public', async () => {
      await api(`/admin/avis/${qaReviewId}/visibility`, {
        method: 'PATCH',
        token: admin.token,
        body: { est_visible: true, note: 'QA restauration avis.' },
      });
      const publicReviews = await api(`/avis/logement/${instantListing.id}`);
      if (!publicReviews.some((item) => Number(item.id) === Number(qaReviewId))) {
        throw new Error('Avis restaure absent du public.');
      }
      return { visiblePublic: true };
    });
  }
  await record('admin litiges', () => api('/admin/litiges', { token: admin.token }));
  if (pendingReservation) {
    const dispute = await record('admin cree litige reservation', () =>
      api('/admin/litiges', {
        method: 'POST',
        token: admin.token,
        body: {
          id_reservation: pendingReservation.id,
          id_ouverture: traveler.user.id,
          id_assigne: admin.user.id,
          sujet: 'Litige QA reservation',
          description: 'Litige QA pour verifier la gestion admin complete.',
          priorite: 'haute',
          note: 'QA creation litige.',
        },
      }));
    if (dispute) {
      await record('admin resout litige reservation', async () => {
        const updated = await api(`/admin/litiges/${dispute.id}`, {
          method: 'PATCH',
          token: admin.token,
          body: {
            statut: 'resolu',
            resolution_note: 'Litige QA resolu.',
            note: 'QA resolution litige.',
          },
        });
        if (updated.statut !== 'resolu' || !updated.date_resolution) {
          throw new Error('Litige non resolu correctement.');
        }
        return updated;
      });
    }
  }
  await record('admin suspend et reactive compte', async () => {
    await api(`/admin/users/${traveler.user.id}/status`, {
      method: 'PATCH',
      token: admin.token,
      body: { statut_compte: 'suspendu', note: 'QA suspension temporaire.' },
    });
    await api('/auth/connexion', {
      method: 'POST',
      expectedStatus: 403,
      body: { identifier: users.traveler.email, mot_de_passe: password },
    });
    await api(`/admin/users/${traveler.user.id}/status`, {
      method: 'PATCH',
      token: admin.token,
      body: { statut_compte: 'actif', note: 'QA reactivation compte.' },
    });
    return api('/auth/connexion', {
      method: 'POST',
      body: { identifier: users.traveler.email, mot_de_passe: password },
    });
  });
  await record('admin journal actions persiste', async () => {
    const actions = await api('/admin/actions', { token: admin.token });
    const hasMessageAction = actions.some((item) => item.action === 'message.visibility' && Number(item.cible_id) === Number(qaMessageId));
    const hasReviewAction = actions.some((item) => item.action === 'review.visibility' && Number(item.cible_id) === Number(qaReviewId));
    if (!hasMessageAction || !hasReviewAction) {
      throw new Error('Journal admin incomplet pour messages/avis.');
    }
    const dbCount = await db.query('SELECT COUNT(*)::int AS count FROM admin_action');
    if ((dbCount.rows[0]?.count || 0) < 1) throw new Error('Aucune action admin en base.');
    return { count: actions.length };
  });

  await record('paiement QA cree', async () => {
    if (createdReservationIds.length === 0) return { count: 0 };
    const result = await db.query('SELECT COUNT(*)::int AS count FROM paiement WHERE id_reservation = ANY($1::bigint[])', [
      createdReservationIds,
    ]);
    const count = result.rows[0]?.count || 0;
    if (count < 1) throw new Error('Aucun paiement QA trouve.');
    if (instantReservation) {
      const onePayment = await db.query(
        'SELECT COUNT(*)::int AS count, MIN(reference_transaction) AS reference FROM paiement WHERE id_reservation = $1',
        [instantReservation.id],
      );
      if (onePayment.rows[0]?.count !== 1) {
        throw new Error('Le paiement idempotent a cree plusieurs lignes.');
      }
      if (qaPaymentReference && onePayment.rows[0]?.reference !== qaPaymentReference) {
        throw new Error('La reference paiement stockee ne correspond pas a la premiere reponse.');
      }
    }
    if (instantReservation) {
      const reviewCount = await db.query('SELECT COUNT(*)::int AS count FROM avis WHERE id_reservation = $1', [
        instantReservation.id,
      ]);
      if (reviewCount.rows[0]?.count !== 1) {
        throw new Error('La contrainte un avis par reservation nest pas respectee.');
      }
    }
    return { count };
  });

  const failed = results.filter((item) => !item.ok);
  console.log(JSON.stringify({ total: results.length, failed: failed.length, failedNames: failed.map((item) => item.name) }, null, 2));

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error(`[qa] failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.pool.end().catch(() => null);
  });
