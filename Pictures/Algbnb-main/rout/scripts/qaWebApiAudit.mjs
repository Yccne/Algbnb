import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../db');

const BASE_URL = (process.env.BASE_URL || 'http://127.0.0.1:3001/api').replace(/\/$/, '');
const password = 'QaCodex123!';

const users = {
  host: {
    email: 'qa.codex.hote@algbnb.local',
    telephone: '0599001001',
    prenom: 'QA',
    nom: 'Hote',
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

const day = (offset) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

const uniqueOffset = () => 365 + (Date.now() % 20000);

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
  if (existing) return existing;

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
    equipements: JSON.stringify(['Wi-Fi', 'Cuisine equipee', 'Parking']),
    photo_urls: JSON.stringify([overrides.photo || 'https://placehold.co/1200x800?text=QA+GEO']),
  };

  for (const [key, value] of Object.entries(payload)) {
    form.append(key, value);
  }

  const created = await api('/annonces', { method: 'POST', token: hostToken, body: form });
  return created.logement;
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

async function main() {
  console.log(`[qa] base URL: ${BASE_URL}`);

  await record('health', () => api('/health'));
  const host = await record('auth hote QA', () => ensureUser('host'));
  const traveler = await record('auth voyageur QA', () => ensureUser('traveler'));
  const admin = await record('auth admin QA', () => ensureUser('admin'));

  if (!host || !traveler || !admin) {
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

  await record('providers auth', () => api('/auth/providers'));
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

  if (!instantListing || !approvalListing) {
    throw new Error('Impossible de preparer les annonces QA.');
  }

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
      photo_urls: JSON.stringify(['https://placehold.co/1200x800?text=QA+INVALID']),
    };
    Object.entries(payload).forEach(([key, value]) => form.append(key, value));
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
          { date_debut: day(20), date_fin: day(22), est_bloque: true, source_blocage: 'maintenance', note_interne: 'QA' },
        ],
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
  const instantReservation = await record('reservation instantanee sans paiement', () =>
    createReservation(traveler.token, instantListing.id, baseOffset));
  const pendingReservation = await record('reservation approbation en attente', () =>
    createReservation(traveler.token, approvalListing.id, baseOffset + 10));

  if (pendingReservation) {
    await record('hote confirme reservation', () =>
      api(`/reservations/${pendingReservation.id}/statut`, {
        method: 'PATCH',
        token: host.token,
        body: { statut: 'confirmee' },
      }));
  }

  if (instantReservation) {
    await record('hote termine reservation', () =>
      api(`/reservations/${instantReservation.id}/statut`, {
        method: 'PATCH',
        token: host.token,
        body: { statut: 'terminee' },
      }));
    await record('avis voyageur', () =>
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
  }

  await record('reservations voyageur', () => api('/reservations/me', { token: traveler.token }));
  await record('conversation avec hote', async () => {
    const conversation = await api('/messages/conversations', {
      method: 'POST',
      token: traveler.token,
      body: { interlocuteur_id: host.user.id },
    });
    await api('/messages', {
      method: 'POST',
      token: traveler.token,
      body: { id_conversation: conversation.id, contenu: 'Message QA Codex.' },
    });
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
  await record('admin litiges', () => api('/admin/litiges', { token: admin.token }));

  await record('aucun paiement cree', async () => {
    if (createdReservationIds.length === 0) return { count: 0 };
    const result = await db.query('SELECT COUNT(*)::int AS count FROM paiement WHERE id_reservation = ANY($1::bigint[])', [
      createdReservationIds,
    ]);
    const count = result.rows[0]?.count || 0;
    if (count !== 0) throw new Error(`${count} paiement(s) trouve(s) pour les reservations QA.`);
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
