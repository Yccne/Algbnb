const express = require('express');
const db = require('../db');
const { verifierToken, estHote } = require('../middlewares/ann');
const { logementUpload } = require('../middlewares/upload');
const { validerAnnonce, parseEquipements, parsePhotoUrls } = require('../middlewares/validerAnnonce');
const { listingSelect, listingGroupBy } = require('../utils/listings');

const router = express.Router();

const requireOwner = async (listingId, userId) => {
  const result = await db.query(
    'SELECT * FROM logement WHERE id = $1 AND id_hote = $2 AND est_supprime = FALSE LIMIT 1',
    [listingId, userId]
  );
  return result.rows[0] || null;
};

router.post('/', verifierToken, estHote, logementUpload.array('photos', 10), validerAnnonce, async (req, res) => {
  const client = await db.getClient();
  try {
    const {
      titre,
      description,
      type_logement,
      adresse,
      ville,
      pays = 'Algérie',
      latitude,
      longitude,
      nb_chambres,
      nb_lits,
      nb_salles_de_bain,
      capacite_accueil,
      prix_par_nuit,
      mode_reservation = 'sur_approbation',
      politique_annulation = 'moderee',
      regles_maison,
      est_actif = true,
      validation_statut = 'valide',
    } = req.body;

    await client.query('BEGIN');
    const listingResult = await client.query(
      `
        INSERT INTO logement (
          id_hote, titre, description, type_logement, adresse, ville, pays,
          latitude, longitude, nb_chambres, nb_lits, nb_salles_de_bain,
          capacite_accueil, prix_par_nuit, mode_reservation, politique_annulation,
          regles_maison, est_actif, validation_statut
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12,
          $13, $14, $15, $16,
          $17, $18, $19
        )
        RETURNING *
      `,
      [
        req.user.id,
        titre.trim(),
        description.trim(),
        type_logement,
        adresse.trim(),
        ville.trim(),
        pays,
        latitude || null,
        longitude || null,
        Number(nb_chambres),
        Number(nb_lits),
        Number(nb_salles_de_bain),
        Number(capacite_accueil),
        Number(prix_par_nuit),
        mode_reservation,
        politique_annulation,
        regles_maison || null,
        est_actif === 'false' ? false : Boolean(est_actif),
        validation_statut,
      ]
    );

    const logement = listingResult.rows[0];
    const photos = req.files || [];
    const photoUrls = parsePhotoUrls(req.body.photo_urls);
    const mergedPhotos = [
      ...photos.map((file) => `/uploads/logements/${file.filename}`),
      ...photoUrls,
    ];

    for (let index = 0; index < mergedPhotos.length; index += 1) {
      await client.query(
        `
          INSERT INTO logement_photo (id_logement, url_photo, ordre_affichage)
          VALUES ($1, $2, $3)
        `,
        [logement.id, mergedPhotos[index], index]
      );
    }

    const equipements = parseEquipements(req.body.equipements);
    for (const item of equipements) {
      if (!item) continue;
      await client.query(
        `
          INSERT INTO logement_equipement (id_logement, nom_equipement)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `,
        [logement.id, String(item).trim()]
      );
    }

    await client.query('COMMIT');
    const detailResult = await db.query(
      `
        ${listingSelect}
        WHERE l.id = $1
        ${listingGroupBy}
      `,
      [logement.id]
    );

    return res.status(201).json({
      message: 'Annonce créée avec succès.',
      logement: detailResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ erreur: error.message });
  } finally {
    client.release();
  }
});

router.get('/mes-annonces', verifierToken, estHote, async (req, res) => {
  try {
    const result = await db.query(
      `
        ${listingSelect}
        WHERE l.id_hote = $1
          AND l.est_supprime = FALSE
        ${listingGroupBy}
        ORDER BY l.date_creation DESC
      `,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/:id', verifierToken, estHote, async (req, res) => {
  try {
    const listing = await requireOwner(req.params.id, req.user.id);
    if (!listing) {
      return res.status(404).json({ erreur: 'Annonce introuvable.' });
    }

    const result = await db.query(
      `
        ${listingSelect}
        WHERE l.id = $1
        ${listingGroupBy}
      `,
      [req.params.id]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.patch('/:id', verifierToken, estHote, logementUpload.array('photos', 10), async (req, res) => {
  const listing = await requireOwner(req.params.id, req.user.id);
  if (!listing) {
    return res.status(404).json({ erreur: 'Annonce introuvable.' });
  }

  const payload = {
    titre: req.body.titre ?? listing.titre,
    description: req.body.description ?? listing.description,
    type_logement: req.body.type_logement ?? listing.type_logement,
    adresse: req.body.adresse ?? listing.adresse,
    ville: req.body.ville ?? listing.ville,
    pays: req.body.pays ?? listing.pays,
    latitude: req.body.latitude ?? listing.latitude,
    longitude: req.body.longitude ?? listing.longitude,
    nb_chambres: req.body.nb_chambres ?? listing.nb_chambres,
    nb_lits: req.body.nb_lits ?? listing.nb_lits,
    nb_salles_de_bain: req.body.nb_salles_de_bain ?? listing.nb_salles_de_bain,
    capacite_accueil: req.body.capacite_accueil ?? listing.capacite_accueil,
    prix_par_nuit: req.body.prix_par_nuit ?? listing.prix_par_nuit,
    mode_reservation: req.body.mode_reservation ?? listing.mode_reservation,
    politique_annulation: req.body.politique_annulation ?? listing.politique_annulation,
    regles_maison: req.body.regles_maison ?? listing.regles_maison,
    validation_statut: req.body.validation_statut ?? listing.validation_statut,
    est_actif: typeof req.body.est_actif === 'boolean' ? req.body.est_actif : listing.est_actif,
  };

  const client = await db.getClient();
  try {
    await client.query('BEGIN');
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
            validation_statut = $17,
            est_actif = $18,
            date_mise_a_jour = NOW()
        WHERE id = $19
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
        payload.validation_statut,
        Boolean(payload.est_actif),
        req.params.id,
      ]
    );

    if (req.body.equipements) {
      const equipements = parseEquipements(req.body.equipements);
      await client.query('DELETE FROM logement_equipement WHERE id_logement = $1', [req.params.id]);
      for (const item of equipements) {
        await client.query(
          'INSERT INTO logement_equipement (id_logement, nom_equipement) VALUES ($1, $2)',
          [req.params.id, String(item).trim()]
        );
      }
    }

    if ((req.files && req.files.length > 0) || req.body.photo_urls) {
      const uploadedPhotos = (req.files || []).map((file) => `/uploads/logements/${file.filename}`);
      const photoUrls = parsePhotoUrls(req.body.photo_urls);
      const mergedPhotos = [...uploadedPhotos, ...photoUrls];
      await client.query('DELETE FROM logement_photo WHERE id_logement = $1', [req.params.id]);
      for (let index = 0; index < mergedPhotos.length; index += 1) {
        await client.query(
          'INSERT INTO logement_photo (id_logement, url_photo, ordre_affichage) VALUES ($1, $2, $3)',
          [req.params.id, mergedPhotos[index], index]
        );
      }
    }

    await client.query('COMMIT');
    const detailResult = await db.query(
      `
        ${listingSelect}
        WHERE l.id = $1
        ${listingGroupBy}
      `,
      [req.params.id]
    );

    return res.json({ logement: detailResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ erreur: error.message });
  } finally {
    client.release();
  }
});

router.patch('/:id/statut', verifierToken, estHote, async (req, res) => {
  const listing = await requireOwner(req.params.id, req.user.id);
  if (!listing) {
    return res.status(404).json({ erreur: 'Annonce introuvable.' });
  }

  try {
    const result = await db.query(
      'UPDATE logement SET est_actif = $1, date_mise_a_jour = NOW() WHERE id = $2 RETURNING id, titre, est_actif',
      [Boolean(req.body.est_actif), req.params.id]
    );
    return res.json({ logement: result.rows[0] });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.put('/:id/disponibilites', verifierToken, estHote, async (req, res) => {
  const listing = await requireOwner(req.params.id, req.user.id);
  if (!listing) {
    return res.status(404).json({ erreur: 'Annonce introuvable.' });
  }

  const ranges = Array.isArray(req.body.disponibilites) ? req.body.disponibilites : [];
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    await client.query(
      "DELETE FROM disponibilite WHERE id_logement = $1 AND source_blocage IN ('manuel', 'maintenance')",
      [req.params.id]
    );

    for (const range of ranges) {
      if (!range.date_debut || !range.date_fin) continue;
      await client.query(
        `
          INSERT INTO disponibilite (id_logement, date_debut, date_fin, est_bloque, source_blocage, note_interne)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          req.params.id,
          range.date_debut,
          range.date_fin,
          range.est_bloque !== false,
          range.source_blocage || 'manuel',
          range.note_interne || null,
        ]
      );
    }

    await client.query('COMMIT');
    const result = await db.query(
      'SELECT * FROM disponibilite WHERE id_logement = $1 ORDER BY date_debut ASC',
      [req.params.id]
    );
    return res.json(result.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(500).json({ erreur: error.message });
  } finally {
    client.release();
  }
});

router.delete('/:id', verifierToken, estHote, async (req, res) => {
  const listing = await requireOwner(req.params.id, req.user.id);
  if (!listing) {
    return res.status(404).json({ erreur: 'Annonce introuvable.' });
  }

  try {
    await db.query('UPDATE logement SET est_supprime = TRUE, est_actif = FALSE, date_mise_a_jour = NOW() WHERE id = $1', [
      req.params.id,
    ]);
    return res.json({ message: 'Annonce supprimée.' });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

module.exports = router;
