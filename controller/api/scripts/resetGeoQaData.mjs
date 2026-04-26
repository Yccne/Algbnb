import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
require('dotenv').config();

const bcrypt = require('bcryptjs');
const db = require('../../../model/api/db');

const password = 'QaCodex123!';

const qaUsers = [
  {
    prenom: 'QA',
    nom: 'Hote',
    email: 'qa.codex.hote@algbnb.local',
    telephone: '0599001001',
    role_type: 'hote',
    verification_niveau: 2,
  },
  {
    prenom: 'QA',
    nom: 'Voyageur',
    email: 'qa.codex.voyageur@algbnb.local',
    telephone: '0599001002',
    role_type: 'voyageur',
    verification_niveau: 1,
  },
  {
    prenom: 'QA',
    nom: 'Admin',
    email: 'qa.codex.admin@algbnb.local',
    telephone: '0599001003',
    role_type: 'admin',
    verification_niveau: 3,
  },
];

const qaListings = [
  {
    titre: '[QA GEO] Bejaia Centre Terrasse',
    description: 'Appartement QA geolocalise au centre de Bejaia pour verifier la recherche et la carte.',
    type_logement: 'appartement',
    adresse: 'Rue de la Liberte, Bejaia',
    ville: 'Bejaia',
    latitude: 36.7518,
    longitude: 5.0567,
    capacite_accueil: 4,
    nb_chambres: 2,
    nb_lits: 3,
    prix_par_nuit: 6500,
    mode_reservation: 'instantanee',
    photo: 'https://placehold.co/1200x800?text=QA+Bejaia+Centre',
  },
  {
    titre: '[QA GEO] Bejaia Ihaddaden Studio',
    description: 'Studio QA proche Ihaddaden avec coordonnees distinctes pour verifier les marqueurs proches.',
    type_logement: 'appartement',
    adresse: 'Ihaddaden, Bejaia',
    ville: 'Bejaia',
    latitude: 36.7392,
    longitude: 5.0704,
    capacite_accueil: 2,
    nb_chambres: 1,
    nb_lits: 1,
    prix_par_nuit: 4800,
    mode_reservation: 'sur_approbation',
    photo: 'https://placehold.co/1200x800?text=QA+Bejaia+Ihaddaden',
  },
  {
    titre: '[QA GEO] Bejaia Sidi Ahmed Familial',
    description: 'Logement QA familial a Sidi Ahmed pour tester la capacite voyageurs et la carte.',
    type_logement: 'maison',
    adresse: 'Sidi Ahmed, Bejaia',
    ville: 'Bejaia',
    latitude: 36.7584,
    longitude: 5.0405,
    capacite_accueil: 5,
    nb_chambres: 3,
    nb_lits: 4,
    prix_par_nuit: 7200,
    mode_reservation: 'sur_approbation',
    photo: 'https://placehold.co/1200x800?text=QA+Bejaia+Sidi+Ahmed',
  },
  {
    titre: '[QA GEO] El Kseur Maison Jardin',
    description: 'Maison QA eloignee de Bejaia centre pour verifier les recherches de communes algeriennes.',
    type_logement: 'maison',
    adresse: 'MVJ6+GJV El Kseur',
    ville: 'El Kseur',
    latitude: 36.68136,
    longitude: 4.86153,
    capacite_accueil: 6,
    nb_chambres: 3,
    nb_lits: 5,
    prix_par_nuit: 8000,
    mode_reservation: 'instantanee',
    photo: 'https://placehold.co/1200x800?text=QA+El+Kseur',
  },
  {
    titre: '[QA GEO] Alger Hydra Appartement',
    description: 'Appartement QA a Hydra pour verifier la recherche generique sur Alger.',
    type_logement: 'appartement',
    adresse: 'Hydra, Alger',
    ville: 'Alger',
    latitude: 36.7465,
    longitude: 3.04197,
    capacite_accueil: 3,
    nb_chambres: 2,
    nb_lits: 2,
    prix_par_nuit: 9500,
    mode_reservation: 'instantanee',
    photo: 'https://placehold.co/1200x800?text=QA+Alger+Hydra',
  },
  {
    titre: '[QA GEO] Alger Bab Ezzouar Loft',
    description: 'Loft QA a Bab Ezzouar pour verifier plusieurs resultats dans Alger.',
    type_logement: 'appartement',
    adresse: 'Bab Ezzouar, Alger',
    ville: 'Alger',
    latitude: 36.7131,
    longitude: 3.1838,
    capacite_accueil: 2,
    nb_chambres: 1,
    nb_lits: 1,
    prix_par_nuit: 6200,
    mode_reservation: 'sur_approbation',
    photo: 'https://placehold.co/1200x800?text=QA+Alger+Bab+Ezzouar',
  },
  {
    titre: '[QA GEO] Oran Front De Mer',
    description: 'Appartement QA a Oran pour tester les villes algeriennes hors Bejaia et Alger.',
    type_logement: 'appartement',
    adresse: 'Front de mer, Oran',
    ville: 'Oran',
    latitude: 35.7033,
    longitude: -0.6501,
    capacite_accueil: 4,
    nb_chambres: 2,
    nb_lits: 3,
    prix_par_nuit: 7000,
    mode_reservation: 'instantanee',
    photo: 'https://placehold.co/1200x800?text=QA+Oran',
  },
  {
    titre: '[QA GEO] Constantine Centre',
    description: 'Appartement QA a Constantine pour tester la recherche multi-villes.',
    type_logement: 'appartement',
    adresse: 'Centre-ville, Constantine',
    ville: 'Constantine',
    latitude: 36.365,
    longitude: 6.6147,
    capacite_accueil: 3,
    nb_chambres: 2,
    nb_lits: 2,
    prix_par_nuit: 6800,
    mode_reservation: 'sur_approbation',
    photo: 'https://placehold.co/1200x800?text=QA+Constantine',
  },
  {
    titre: '[QA GEO] Setif Centre',
    description: 'Appartement QA a Setif pour verifier la recherche generale en Algerie.',
    type_logement: 'appartement',
    adresse: 'Centre-ville, Setif',
    ville: 'Setif',
    latitude: 36.1911,
    longitude: 5.4137,
    capacite_accueil: 2,
    nb_chambres: 1,
    nb_lits: 1,
    prix_par_nuit: 5200,
    mode_reservation: 'instantanee',
    photo: 'https://placehold.co/1200x800?text=QA+Setif',
  },
  {
    titre: '[QA GEO] Tizi Ouzou Centre',
    description: 'Appartement QA a Tizi Ouzou pour verifier les recherches composees.',
    type_logement: 'appartement',
    adresse: 'Centre-ville, Tizi Ouzou',
    ville: 'Tizi Ouzou',
    latitude: 36.7118,
    longitude: 4.0459,
    capacite_accueil: 4,
    nb_chambres: 2,
    nb_lits: 3,
    prix_par_nuit: 6000,
    mode_reservation: 'sur_approbation',
    photo: 'https://placehold.co/1200x800?text=QA+Tizi+Ouzou',
  },
];

const ids = (rows) => rows.map((row) => String(row.id));

async function resetQaData(client) {
  const userResult = await client.query(
    "SELECT id FROM utilisateur WHERE email LIKE 'qa.codex.%@algbnb.local'"
  );
  const userIds = ids(userResult.rows);

  const listingResult = await client.query(
    `
      SELECT id
      FROM logement
      WHERE titre LIKE '[QA%'
         OR titre LIKE '[QA GEO%'
         OR ($1::bigint[] <> '{}'::bigint[] AND id_hote = ANY($1::bigint[]))
    `,
    [userIds]
  );
  const listingIds = ids(listingResult.rows);

  const reservationResult = await client.query(
    `
      SELECT id
      FROM reservation
      WHERE ($1::bigint[] <> '{}'::bigint[] AND id_logement = ANY($1::bigint[]))
         OR ($2::bigint[] <> '{}'::bigint[] AND id_voyageur = ANY($2::bigint[]))
    `,
    [listingIds, userIds]
  );
  const reservationIds = ids(reservationResult.rows);

  await client.query(
    `
      DELETE FROM litige
      WHERE ($1::bigint[] <> '{}'::bigint[] AND id_reservation = ANY($1::bigint[]))
         OR ($2::bigint[] <> '{}'::bigint[] AND id_ouverture = ANY($2::bigint[]))
    `,
    [reservationIds, userIds]
  );
  await client.query(
    `
      DELETE FROM notification
      WHERE ($1::bigint[] <> '{}'::bigint[] AND id_utilisateur = ANY($1::bigint[]))
         OR ($2::text[] <> '{}'::text[] AND meta ->> 'reservationId' = ANY($2::text[]))
         OR ($3::text[] <> '{}'::text[] AND meta ->> 'logementId' = ANY($3::text[]))
    `,
    [userIds, reservationIds, listingIds]
  );
  await client.query(
    `
      DELETE FROM avis
      WHERE ($1::bigint[] <> '{}'::bigint[] AND id_logement = ANY($1::bigint[]))
         OR ($2::bigint[] <> '{}'::bigint[] AND id_reservation = ANY($2::bigint[]))
         OR ($3::bigint[] <> '{}'::bigint[] AND (id_voyageur = ANY($3::bigint[]) OR id_hote = ANY($3::bigint[])))
    `,
    [listingIds, reservationIds, userIds]
  );
  await client.query(
    "DELETE FROM paiement WHERE $1::bigint[] <> '{}'::bigint[] AND id_reservation = ANY($1::bigint[])",
    [reservationIds]
  );
  await client.query(
    "DELETE FROM disponibilite WHERE $1::bigint[] <> '{}'::bigint[] AND id_logement = ANY($1::bigint[])",
    [listingIds]
  );
  await client.query(
    `
      DELETE FROM voyageur_favori
      WHERE ($1::bigint[] <> '{}'::bigint[] AND id_logement = ANY($1::bigint[]))
         OR ($2::bigint[] <> '{}'::bigint[] AND id_voyageur = ANY($2::bigint[]))
    `,
    [listingIds, userIds]
  );
  await client.query(
    "DELETE FROM reservation WHERE $1::bigint[] <> '{}'::bigint[] AND id = ANY($1::bigint[])",
    [reservationIds]
  );
  await client.query(
    "DELETE FROM logement_equipement WHERE $1::bigint[] <> '{}'::bigint[] AND id_logement = ANY($1::bigint[])",
    [listingIds]
  );
  await client.query(
    "DELETE FROM logement_photo WHERE $1::bigint[] <> '{}'::bigint[] AND id_logement = ANY($1::bigint[])",
    [listingIds]
  );
  await client.query(
    "DELETE FROM logement WHERE $1::bigint[] <> '{}'::bigint[] AND id = ANY($1::bigint[])",
    [listingIds]
  );
  await client.query(
    `
      DELETE FROM conversation
      WHERE $1::bigint[] <> '{}'::bigint[]
        AND (id_utilisateur1 = ANY($1::bigint[]) OR id_utilisateur2 = ANY($1::bigint[]))
    `,
    [userIds]
  );
  await client.query(
    "DELETE FROM password_reset_token WHERE $1::bigint[] <> '{}'::bigint[] AND id_utilisateur = ANY($1::bigint[])",
    [userIds]
  );
  await client.query(
    "DELETE FROM utilisateur WHERE $1::bigint[] <> '{}'::bigint[] AND id = ANY($1::bigint[])",
    [userIds]
  );

  return {
    users: userIds.length,
    listings: listingIds.length,
    reservations: reservationIds.length,
  };
}

async function seedQaData(client) {
  const hash = await bcrypt.hash(password, 10);
  const createdUsers = {};

  for (const user of qaUsers) {
    const result = await client.query(
      `
        INSERT INTO utilisateur (
          prenom, nom, email, telephone, mot_de_passe, role_type,
          provider_source, est_verifie, verification_niveau, statut_compte
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'local', TRUE, $7, 'actif')
        RETURNING id
      `,
      [user.prenom, user.nom, user.email, user.telephone, hash, user.role_type, user.verification_niveau]
    );
    createdUsers[user.role_type] = result.rows[0].id;
  }

  const listingIds = [];
  for (const listing of qaListings) {
    const result = await client.query(
      `
        INSERT INTO logement (
          id_hote, titre, description, type_logement, adresse, ville, pays,
          latitude, longitude, nb_chambres, nb_lits, nb_salles_de_bain,
          capacite_accueil, prix_par_nuit, mode_reservation, politique_annulation,
          regles_maison, est_actif, validation_statut
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, 'Algerie',
          $7, $8, $9, $10, 1,
          $11, $12, $13, 'moderee',
          'Respect du voisinage et pas de fete.', TRUE, 'valide'
        )
        RETURNING id
      `,
      [
        createdUsers.hote,
        listing.titre,
        listing.description,
        listing.type_logement,
        listing.adresse,
        listing.ville,
        listing.latitude,
        listing.longitude,
        listing.nb_chambres,
        listing.nb_lits,
        listing.capacite_accueil,
        listing.prix_par_nuit,
        listing.mode_reservation,
      ]
    );
    const listingId = result.rows[0].id;
    listingIds.push(listingId);

    await client.query(
      'INSERT INTO logement_photo (id_logement, url_photo, ordre_affichage) VALUES ($1, $2, 0)',
      [listingId, listing.photo]
    );

    for (const equipement of ['Wi-Fi', 'Cuisine equipee', 'Parking']) {
      await client.query(
        'INSERT INTO logement_equipement (id_logement, nom_equipement) VALUES ($1, $2)',
        [listingId, equipement]
      );
    }
  }

  return {
    users: Object.keys(createdUsers).length,
    listings: listingIds.length,
  };
}

async function main() {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    const removed = await resetQaData(client);
    const seeded = await seedQaData(client);
    await client.query('COMMIT');
    console.log(JSON.stringify({ removed, seeded }, null, 2));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[qa-geo] failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main();
