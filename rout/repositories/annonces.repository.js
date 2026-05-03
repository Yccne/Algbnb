const database = require('./database.repository');
const { listingSelect, listingGroupBy } = require('../utils/listings');

const findOwnedListing = async ({ listingId, userId }) => {
  const result = await database.query(
    'SELECT * FROM logement WHERE id = $1 AND id_hote = $2 AND est_supprime = FALSE LIMIT 1',
    [listingId, userId]
  );
  return result.rows[0] || null;
};

const findDetail = async (listingId) => {
  const result = await database.query(
    `
      ${listingSelect}
      WHERE l.id = $1
      ${listingGroupBy}
    `,
    [listingId]
  );
  return result.rows[0] || null;
};

const listByOwner = async (ownerId) => {
  const result = await database.query(
    `
      ${listingSelect}
      WHERE l.id_hote = $1
        AND l.est_supprime = FALSE
      ${listingGroupBy}
      ORDER BY l.date_creation DESC
    `,
    [ownerId]
  );
  return result.rows;
};

const insertPhotos = async (queryable, listingId, photos) => {
  for (let index = 0; index < photos.length; index += 1) {
    await queryable.query(
      `
        INSERT INTO logement_photo (id_logement, url_photo, ordre_affichage)
        VALUES ($1, $2, $3)
      `,
      [listingId, photos[index], index]
    );
  }
};

const insertEquipements = async (queryable, listingId, equipements) => {
  for (const item of equipements) {
    if (!item) continue;
    await queryable.query(
      `
        INSERT INTO logement_equipement (id_logement, nom_equipement)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [listingId, String(item).trim()]
    );
  }
};

const createListing = async ({ ownerId, payload, photos, equipements }) => {
  const listing = await database.withTransaction(async (client) => {
    const result = await client.query(
      `
        INSERT INTO logement (
          id_hote, titre, description, type_logement, adresse, ville, pays,
          latitude, longitude, nb_chambres, nb_lits, nb_salles_de_bain,
          capacite_accueil, prix_par_nuit, mode_reservation, politique_annulation,
          regles_maison, compte_ccp, est_actif, validation_statut
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19, $20
        )
        RETURNING *
      `,
      [
        ownerId,
        payload.titre.trim(),
        payload.description.trim(),
        payload.type_logement,
        payload.adresse.trim(),
        payload.ville.trim(),
        payload.pays || 'Algerie',
        payload.latitude || null,
        payload.longitude || null,
        Number(payload.nb_chambres),
        Number(payload.nb_lits),
        Number(payload.nb_salles_de_bain),
        Number(payload.capacite_accueil),
        Number(payload.prix_par_nuit),
        payload.mode_reservation || 'sur_approbation',
        payload.politique_annulation || 'moderee',
        payload.regles_maison || null,
        payload.compte_ccp ? payload.compte_ccp.replace(/[\s-]/g, '') : null,
        payload.est_actif === 'false' ? false : Boolean(payload.est_actif ?? true),
        payload.validation_statut || 'valide',
      ]
    );

    const created = result.rows[0];
    await insertPhotos(client, created.id, photos);
    await insertEquipements(client, created.id, equipements);
    return created;
  });

  return findDetail(listing.id);
};

const updateListing = async ({ listingId, payload, photos, equipements, replacePhotos, replaceEquipements }) => {
  await database.withTransaction(async (client) => {
    await client.query(
      `
        UPDATE logement
        SET titre = $1,
            description = $2,
            type_logement = $3,
            adresse = $4,
            ville = $5,
            pays = $6,
            latitude = $7,
            longitude = $8,
            nb_chambres = $9,
            nb_lits = $10,
            nb_salles_de_bain = $11,
            capacite_accueil = $12,
            prix_par_nuit = $13,
            mode_reservation = $14,
            politique_annulation = $15,
            regles_maison = $16,
            compte_ccp = $17,
            validation_statut = $18,
            est_actif = $19,
            date_mise_a_jour = NOW()
        WHERE id = $20
      `,
      [
        payload.titre,
        payload.description,
        payload.type_logement,
        payload.adresse,
        payload.ville,
        payload.pays,
        payload.latitude || null,
        payload.longitude || null,
        Number(payload.nb_chambres),
        Number(payload.nb_lits),
        Number(payload.nb_salles_de_bain),
        Number(payload.capacite_accueil),
        Number(payload.prix_par_nuit),
        payload.mode_reservation,
        payload.politique_annulation,
        payload.regles_maison || null,
        payload.compte_ccp ? payload.compte_ccp.replace(/[\s-]/g, '') : null,
        payload.validation_statut,
        Boolean(payload.est_actif),
        listingId,
      ]
    );

    if (replaceEquipements) {
      await client.query('DELETE FROM logement_equipement WHERE id_logement = $1', [listingId]);
      await insertEquipements(client, listingId, equipements);
    }

    if (replacePhotos) {
      await client.query('DELETE FROM logement_photo WHERE id_logement = $1', [listingId]);
      await insertPhotos(client, listingId, photos);
    }
  });

  return findDetail(listingId);
};

const updateActiveStatus = async ({ listingId, active }) => {
  const result = await database.query(
    'UPDATE logement SET est_actif = $1, date_mise_a_jour = NOW() WHERE id = $2 RETURNING id, titre, est_actif',
    [active, listingId]
  );
  return result.rows[0] || null;
};

const replaceAvailability = async ({ listingId, ranges }) => {
  await database.withTransaction(async (client) => {
    await client.query(
      "DELETE FROM disponibilite WHERE id_logement = $1 AND source_blocage IN ('manuel', 'maintenance')",
      [listingId]
    );

    for (const range of ranges) {
      if (!range.date_debut || !range.date_fin) continue;
      await client.query(
        `
          INSERT INTO disponibilite (id_logement, date_debut, date_fin, est_bloque, source_blocage, note_interne)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          listingId,
          range.date_debut,
          range.date_fin,
          range.est_bloque !== false,
          range.source_blocage || 'manuel',
          range.note_interne || null,
        ]
      );
    }
  });

  const result = await database.query(
    'SELECT * FROM disponibilite WHERE id_logement = $1 ORDER BY date_debut ASC',
    [listingId]
  );
  return result.rows;
};

const softDelete = async (listingId) => {
  await database.query(
    'UPDATE logement SET est_supprime = TRUE, est_actif = FALSE, date_mise_a_jour = NOW() WHERE id = $1',
    [listingId]
  );
};

module.exports = {
  createListing,
  findDetail,
  findOwnedListing,
  listByOwner,
  replaceAvailability,
  softDelete,
  updateActiveStatus,
  updateListing,
};