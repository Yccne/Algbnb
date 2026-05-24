import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('dotenv').config();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../../model/api/db');
const { jwtSecret } = require('../../../model/api/config/auth.config');

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

const day = (offset) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

const uniqueOffset = () => 600 + (Date.now() % 20000);
const tinyPngBlob = () => new Blob([Buffer.from(tinyPngBase64, 'base64')], { type: 'image/png' });
const validCardPayload = () => ({
  numero_carte: '1234123412341234',
  nom_porteur: 'QA AVANCE',
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
    await db.query(
      `
        INSERT INTO utilisateur (
          prenom, nom, email, telephone, mot_de_passe, role_type,
          provider_source, est_verifie, verification_niveau, statut_compte
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'local', TRUE, $7, 'actif')
      `,
      [user.prenom, user.nom, user.email, user.telephone, hash, user.role_type, verificationLevel]
    );
  } else {
    await db.query(
      `
        UPDATE utilisateur
        SET prenom = $1,
            nom = $2,
            telephone = $3,
            mot_de_passe = $4,
            role_type = $5,
            provider_source = 'local',
            est_verifie = TRUE,
            verification_niveau = $6,
            statut_compte = 'actif',
            date_mise_a_jour = NOW()
        WHERE email = $7
      `,
      [user.prenom, user.nom, user.telephone, hash, user.role_type, verificationLevel, user.email]
    );
  }

  return api('/auth/connexion', {
    method: 'POST',
    body: { identifier: user.email, mot_de_passe: password },
  });
}

async function cleanupAdvancedData() {
  const listingRows = await db.query("SELECT id FROM logement WHERE titre LIKE '[QA ADV]%'");
  const listingIds = listingRows.rows.map((row) => Number(row.id));
  if (listingIds.length === 0) return;

  const reservationRows = await db.query(
    `
      SELECT id
      FROM reservation
      WHERE id_logement = ANY($1::int[])
    `,
    [listingIds]
  );
  const reservationIds = reservationRows.rows.map((row) => Number(row.id));

  const exchangeRows = await db.query(
    `
      SELECT id
      FROM echange_logement
      WHERE id_logement_demandeur = ANY($1::int[])
         OR id_logement_receveur = ANY($1::int[])
    `,
    [listingIds]
  );
  const exchangeIds = exchangeRows.rows.map((row) => Number(row.id));

  await db.query('DELETE FROM notification WHERE meta ->> $1 = ANY($2::text[]) OR meta ->> $3 = ANY($4::text[])', [
    'reservationId',
    reservationIds.map(String),
    'exchangeId',
    exchangeIds.map(String),
  ]);
  await db.query('DELETE FROM litige WHERE id_reservation = ANY($1::int[])', [reservationIds]);
  await db.query('DELETE FROM paiement WHERE id_reservation = ANY($1::int[])', [reservationIds]);
  await db.query('DELETE FROM avis WHERE id_reservation = ANY($1::int[]) OR id_logement = ANY($2::int[])', [
    reservationIds,
    listingIds,
  ]);
  await db.query('DELETE FROM disponibilite WHERE id_logement = ANY($1::int[])', [listingIds]);
  await db.query('DELETE FROM voyageur_favori WHERE id_logement = ANY($1::int[])', [listingIds]);
  await db.query('DELETE FROM echange_logement WHERE id = ANY($1::int[])', [exchangeIds]);
  await db.query('DELETE FROM reservation WHERE id = ANY($1::int[])', [reservationIds]);
  await db.query('DELETE FROM logement_echange_preference WHERE id_logement = ANY($1::int[])', [listingIds]);
  await db.query('DELETE FROM logement_equipement WHERE id_logement = ANY($1::int[])', [listingIds]);
  await db.query('DELETE FROM logement_photo WHERE id_logement = ANY($1::int[])', [listingIds]);
  await db.query('DELETE FROM logement WHERE id = ANY($1::int[])', [listingIds]);
}

function listingForm(title, overrides = {}, photoCount = 4) {
  const form = new FormData();
  const payload = {
    titre: title,
    description:
      overrides.description ||
      'Annonce QA avancee generee par Codex pour tester les validations profondes du site Algbnb.',
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

async function createListing(token, title, overrides = {}, photoCount = 4) {
  const created = await api('/annonces', {
    method: 'POST',
    token,
    body: listingForm(title, overrides, photoCount),
  });
  return created.logement;
}

async function createReservation(token, listingId, startOffset, endOffset, voyageurs = 2) {
  const reservation = await api('/reservations', {
    method: 'POST',
    token,
    body: {
      id_logement: listingId,
      date_arrivee: day(startOffset),
      date_depart: day(endOffset),
      nb_voyageurs: voyageurs,
    },
  });
  createdReservationIds.push(reservation.id);
  return reservation;
}

async function main() {
  console.log(`[qa-advanced-api] base URL: ${BASE_URL}`);

  await record('health', () => api('/health'));
  await cleanupAdvancedData();

  const host = await record('auth hote avance', () => ensureUser('host'));
  const host2 = await record('auth hote tiers avance', () => ensureUser('host2'));
  const traveler = await record('auth voyageur avance', () => ensureUser('traveler'));
  const admin = await record('auth admin avance', () => ensureUser('admin'));
  if (!host || !host2 || !traveler || !admin) throw new Error('Comptes QA avances indisponibles.');

  const expiredToken = jwt.sign({ id: traveler.user.id, role: 'voyageur', email: traveler.user.email }, jwtSecret, {
    expiresIn: '-1s',
  });

  await record('token manquant refuse reservations', () => api('/reservations/me', { expectedStatus: 401 }));
  await record('token invalide refuse reservations', () =>
    api('/reservations/me', { token: 'token-invalide', expectedStatus: 403 }));
  await record('token expire refuse reservations', () =>
    api('/reservations/me', { token: expiredToken, expectedStatus: 403 }));
  await record('voyageur refuse routes hote', () =>
    api('/annonces/mes-annonces', { token: traveler.token, expectedStatus: 403 }));
  await record('voyageur refuse dashboard hote', () =>
    api('/dashboard/host/me', { token: traveler.token, expectedStatus: 403 }));

  await record('creation annonce refuse zero photo', () =>
    api('/annonces', {
      method: 'POST',
      token: host.token,
      expectedStatus: 400,
      body: listingForm('[QA ADV] Zero Photo Refusee', {}, 0),
    }));
  await record('creation annonce refuse une photo', () =>
    api('/annonces', {
      method: 'POST',
      token: host.token,
      expectedStatus: 400,
      body: listingForm('[QA ADV] Une Photo Refusee', { latitude: '36.7521000', longitude: '5.0569000' }, 1),
    }));
  await record('creation annonce refuse deux photos', () =>
    api('/annonces', {
      method: 'POST',
      token: host.token,
      expectedStatus: 400,
      body: listingForm('[QA ADV] Deux Photos Refusees', { latitude: '36.7522000', longitude: '5.0570000' }, 2),
    }));
  await record('creation annonce refuse trois photos', () =>
    api('/annonces', {
      method: 'POST',
      token: host.token,
      expectedStatus: 400,
      body: listingForm('[QA ADV] Trois Photos Refusees', { latitude: '36.7523000', longitude: '5.0571000' }, 3),
    }));
  const fourPhotoListing = await record('creation annonce accepte quatre photos', () =>
    createListing(host.token, '[QA ADV] Quatre Photos Acceptees', { latitude: '36.7524000', longitude: '5.0572000' }, 4));
  await record('creation annonce accepte dix photos', () =>
    createListing(host.token, '[QA ADV] Dix Photos Acceptees', { latitude: '36.7525000', longitude: '5.0573000' }, 10));
  await record('creation annonce refuse onze photos', () =>
    api('/annonces', {
      method: 'POST',
      token: host.token,
      expectedStatus: 400,
      body: listingForm('[QA ADV] Onze Photos Refusees', { latitude: '36.7526000', longitude: '5.0574000' }, 11),
    }));
  if (fourPhotoListing) {
    await record('edition conserve quatre photos existantes', async () => {
      const updated = await api(`/annonces/${fourPhotoListing.id}`, {
        method: 'PATCH',
        token: host.token,
        body: listingForm('[QA ADV] Quatre Photos Acceptees', { regles_maison: 'Edition sans nouvelles photos.' }, 0),
      });
      const photos = updated.logement?.photos || updated.photos;
      if (!Array.isArray(photos) || photos.length !== 4) {
        throw new Error(`Photos existantes non conservees: ${photos?.length || 0}`);
      }
      return { photos: photos.length };
    });
    await record('edition refuse trois nouvelles photos', () =>
      api(`/annonces/${fourPhotoListing.id}`, {
        method: 'PATCH',
        token: host.token,
        expectedStatus: 400,
        body: listingForm('[QA ADV] Quatre Photos Acceptees', {}, 3),
      }));
    await record('edition accepte quatre nouvelles photos', async () => {
      const updated = await api(`/annonces/${fourPhotoListing.id}`, {
        method: 'PATCH',
        token: host.token,
        body: listingForm('[QA ADV] Quatre Photos Acceptees', {}, 4),
      });
      const photos = updated.logement?.photos || updated.photos;
      if (!Array.isArray(photos) || photos.length !== 4) {
        throw new Error(`Remplacement galerie invalide: ${photos?.length || 0}`);
      }
      return { photos: photos.length };
    });
  }

  const instantListing = await record('annonce avance instantanee', () =>
    createListing(host.token, '[QA ADV] Bejaia Calendrier Bloque', {
      mode_reservation: 'instantanee',
      latitude: '36.7531000',
      longitude: '5.0578000',
      capacite_accueil: '4',
    }));
  const approvalListing = await record('annonce avance approbation', () =>
    createListing(host.token, '[QA ADV] Bejaia Approbation Hote', {
      mode_reservation: 'sur_approbation',
      latitude: '36.7535000',
      longitude: '5.0580000',
      capacite_accueil: '5',
    }));
  const host2Listing = await record('annonce avance hote tiers', () =>
    createListing(host2.token, '[QA ADV] Alger Hote Tiers', {
      ville: 'Alger',
      adresse: 'Hydra, Alger',
      latitude: '36.7489000',
      longitude: '3.0404000',
      mode_reservation: 'sur_approbation',
    }));
  await record('annonce avance el kseur', () =>
    createListing(host.token, '[QA ADV] El Kseur Jardin', {
      ville: 'El Kseur',
      adresse: 'MVJ6+GJV El Kseur',
      latitude: '36.6813600',
      longitude: '4.8615300',
      mode_reservation: 'instantanee',
    }));
  await record('annonce avance timimoun', () =>
    createListing(host.token, '[QA ADV] Timimoun Oasis', {
      ville: 'Timimoun',
      adresse: 'Ksour de Timimoun',
      latitude: '29.2639000',
      longitude: '0.2309800',
      mode_reservation: 'instantanee',
    }));
  await record('annonce avance tamanrasset', () =>
    createListing(host.token, '[QA ADV] Tamanrasset Centre', {
      ville: 'Tamanrasset',
      adresse: 'Centre-ville Tamanrasset',
      latitude: '22.7850000',
      longitude: '5.5228000',
      mode_reservation: 'instantanee',
    }));

  if (!instantListing || !approvalListing || !host2Listing) {
    throw new Error('Annonces QA avancees indisponibles.');
  }

  await record('reservation refuse depart egal arrivee', () =>
    api('/reservations', {
      method: 'POST',
      token: traveler.token,
      expectedStatus: 400,
      body: {
        id_logement: instantListing.id,
        date_arrivee: day(30),
        date_depart: day(30),
        nb_voyageurs: 2,
      },
    }));

  await record('blocage calendrier pour traversee', () =>
    api(`/annonces/${instantListing.id}/disponibilites`, {
      method: 'PUT',
      token: host.token,
      body: {
        disponibilites: [
          { date_debut: day(40), date_fin: day(41), est_bloque: true, source_blocage: 'manuel', note_interne: 'QA ADV blocage' },
        ],
      },
    }));
  await record('reservation refuse sejour traversant blocage', () =>
    api('/reservations', {
      method: 'POST',
      token: traveler.token,
      expectedStatus: 400,
      body: {
        id_logement: instantListing.id,
        date_arrivee: day(39),
        date_depart: day(42),
        nb_voyageurs: 2,
      },
    }));

  const paidReservation = await record('reservation payee puis annulee voyageur', () =>
    createReservation(traveler.token, instantListing.id, 60, 63));
  if (paidReservation) {
    await record('paiement reservation avancee', () =>
      api(`/paiements/reservation/${paidReservation.id}`, {
        method: 'POST',
        token: traveler.token,
        body: validCardPayload(),
      }));
    await record('annulation voyageur rembourse et debloque', async () => {
      await api(`/reservations/${paidReservation.id}/annuler`, {
        method: 'PATCH',
        token: traveler.token,
        body: { motif_annulation: 'QA avance annulation voyageur.' },
      });
      const payment = await db.query('SELECT statut FROM paiement WHERE id_reservation = $1', [paidReservation.id]);
      if (payment.rows[0]?.statut !== 'rembourse') throw new Error('Paiement non rembourse.');
      const blocks = await db.query(
        `
          SELECT COUNT(*)::int AS count
          FROM disponibilite
          WHERE id_logement = $1
            AND source_blocage = 'reservation'
            AND date_debut = $2
            AND date_fin = $3
        `,
        [instantListing.id, day(60), day(63)]
      );
      if ((blocks.rows[0]?.count || 0) !== 0) throw new Error('Blocage reservation non supprime.');
      return { paiement: payment.rows[0].statut };
    });
  }

  const host2Reservation = await record('reservation hote tiers en attente', () =>
    createReservation(traveler.token, host2Listing.id, 80, 83));
  if (host2Reservation) {
    await record('hote ne confirme pas reservation autre hote', () =>
      api(`/reservations/${host2Reservation.id}/statut`, {
        method: 'PATCH',
        token: host.token,
        expectedStatus: 403,
        body: { statut: 'confirmee' },
      }));

    const dispute = await record('voyageur ouvre litige conversation admin', async () => {
      const opened = await api(`/reservations/${host2Reservation.id}/litige`, {
        method: 'POST',
        token: traveler.token,
        body: { message: 'QA avance: litige voyageur avec preuve photo a venir.' },
      });
      if (!opened.conversationId || !opened.litige?.id) {
        throw new Error('Litige ou conversation manquante.');
      }
      return opened;
    });

    if (dispute?.conversationId) {
      await record('photo preuve envoyee dans litige', async () => {
        const form = new FormData();
        form.append('id_conversation', dispute.conversationId);
        form.append('contenu', 'Photo preuve QA avancee.');
        form.append('photo', tinyPngBlob(), 'preuve-litige.png');
        const message = await api('/messages/photo', {
          method: 'POST',
          token: traveler.token,
          body: form,
        });
        if (!message.photo_url) throw new Error('Photo de litige non enregistree.');
        return { message: message.id };
      });

      await record('admin lit conversation litige par ID', async () => {
        const rows = await api(`/admin/conversations?search=${dispute.conversationId}`, { token: admin.token });
        if (!rows.some((row) => Number(row.conversation_id) === Number(dispute.conversationId))) {
          throw new Error('Conversation introuvable par ID.');
        }
        const messages = await api(`/admin/conversations/${dispute.conversationId}/messages`, { token: admin.token });
        if (!messages.some((message) => message.photo_url)) throw new Error('Preuve photo absente cote admin.');
        return { messages: messages.length };
      });
    }

    await record('admin recherche utilisateur par ID', async () => {
      const rows = await api(`/admin/users?search=${traveler.user.id}`, { token: admin.token });
      if (!rows.some((row) => Number(row.id) === Number(traveler.user.id))) {
        throw new Error('Utilisateur introuvable par ID.');
      }
      return { count: rows.length };
    });

    await record('admin recherche annonce par ID', async () => {
      const rows = await api(`/admin/annonces?search=${host2Listing.id}`, { token: admin.token });
      if (!rows.some((row) => Number(row.id) === Number(host2Listing.id))) {
        throw new Error('Annonce introuvable par ID.');
      }
      return { count: rows.length };
    });

    await record('admin impersonne voyageur puis revient', async () => {
      const session = await api(`/admin/users/${traveler.user.id}/impersonation`, {
        method: 'POST',
        token: admin.token,
      });
      if (!session.token || session.user?.role_type !== 'voyageur' || !session.user?.impersonation?.active) {
        throw new Error('Session impersonation invalide.');
      }
      const me = await api('/auth/me', { token: session.token });
      if (me.user?.role_type !== 'voyageur' || !me.user?.impersonation?.active) {
        throw new Error('JWT impersonation non reconnu.');
      }
      await api('/admin/impersonation/end', {
        method: 'POST',
        token: admin.token,
        body: { userId: traveler.user.id },
      });
      const logs = await api('/admin/actions?search=impersonation', { token: admin.token });
      if (!logs.some((row) => row.action === 'impersonation.start')) {
        throw new Error('Demarrage impersonation non journalise.');
      }
      return { impersonatedUserId: traveler.user.id };
    });

    await record('admin ne peut pas impersonner admin', () =>
      api(`/admin/users/${admin.user.id}/impersonation`, {
        method: 'POST',
        token: admin.token,
        expectedStatus: 403,
      }));

    await record('admin cree litige depuis commentaire avis', async () => {
      const insertedReview = await db.query(
        `
          INSERT INTO avis (
            id_voyageur, id_hote, id_logement, id_reservation,
            note_logement, note_hote, commentaire
          )
          VALUES ($1, $2, $3, $4, 2, 2, 'QA avance commentaire litigieux.')
          ON CONFLICT (id_reservation)
          DO UPDATE SET commentaire = EXCLUDED.commentaire
          RETURNING *
        `,
        [traveler.user.id, host2.user.id, host2Listing.id, host2Reservation.id]
      );
      const review = insertedReview.rows[0];
      const created = await api('/admin/litiges', {
        method: 'POST',
        token: admin.token,
        body: {
          id_reservation: host2Reservation.id,
          id_ouverture: traveler.user.id,
          sujet: `Avis #${review.id} - litige commentaire`,
          description: 'Ouverture QA depuis commentaire visible dans la moderation.',
          priorite: 'normale',
          note: 'QA creation litige depuis commentaire.',
        },
      });
      if (!created.id_conversation) throw new Error('Litige commentaire sans conversation admin.');
      return { litige: created.id, conversation: created.id_conversation };
    });
  }

  await record('admin ne participe pas aux echanges cote API', () =>
    api(`/echanges/logements/${instantListing.id}/preference`, {
      method: 'PATCH',
      token: admin.token,
      expectedStatus: 403,
      body: { est_ouvert: true },
    }));
  await record('admin lit les echanges en console', async () => {
    const rows = await api('/admin/echanges', { token: admin.token });
    if (!Array.isArray(rows)) throw new Error('Console echanges admin invalide.');
    return { count: rows.length };
  });

  await record('conversation creee pour controle acces', async () => {
    const conversation = await api('/messages/conversations', {
      method: 'POST',
      token: traveler.token,
      body: { interlocuteur_id: host.user.id },
    });
    await api('/messages', {
      method: 'POST',
      token: traveler.token,
      body: { id_conversation: conversation.id, contenu: 'Message QA avance.' },
    });
    await api(`/messages/conversation/${conversation.id}`, { token: host2.token, expectedStatus: 403 });
    await api('/messages', {
      method: 'POST',
      token: host2.token,
      expectedStatus: 403,
      body: { id_conversation: conversation.id, contenu: 'Intrusion QA.' },
    });
    return { conversation: conversation.id };
  });

  for (const term of ['bejaia', 'bjaia', 'béjaïa', 'el kser', 'el kseur', 'timimun', 'tamanraset']) {
    await record(`recherche avancee ${term}`, async () => {
      const rows = await api(`/logements?paginated=true&search=${encodeURIComponent(term)}&limit=12`);
      const items = Array.isArray(rows.items) ? rows.items : rows;
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error(`Aucun resultat pour ${term}.`);
      }
      return { count: items.length };
    });
  }

  const failed = results.filter((item) => !item.ok);
  console.log(JSON.stringify({ total: results.length, failed: failed.length, failedNames: failed.map((item) => item.name) }, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(`[qa-advanced-api] failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.pool.end();
  });
