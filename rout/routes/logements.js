const express = require('express');
const db = require('../db');
const { listingSelect, listingGroupBy } = require('../utils/listings');

const router = express.Router();

const isTrue = (value) => ['true', '1', 'yes', 'on'].includes(String(value || '').toLowerCase());

const buildSearchContext = (query, originalUrl = '') => {
  const fallbackParams = originalUrl ? new URL(originalUrl, 'http://local').searchParams : null;
  const readValue = (...keys) => {
    for (const key of keys) {
      if (query[key] !== undefined) {
        return query[key];
      }
      const fallbackValue = fallbackParams?.get(key);
      if (fallbackValue !== null && fallbackValue !== undefined) {
        return fallbackValue;
      }
    }
    return undefined;
  };

  const search = String(readValue('search') || '').trim().toLowerCase();
  const type = String(readValue('type') || '').trim();
  const prixMin = readValue('prixMin') !== undefined && readValue('prixMin') !== '' ? Number(readValue('prixMin')) : null;
  const prixMax = readValue('prixMax') !== undefined && readValue('prixMax') !== '' ? Number(readValue('prixMax')) : null;
  const chambres = readValue('chambres') !== undefined && readValue('chambres') !== '' ? Number(readValue('chambres')) : null;
  const lits = readValue('lits') !== undefined && readValue('lits') !== '' ? Number(readValue('lits')) : null;
  const voyageurs = readValue('voyageurs') !== undefined && readValue('voyageurs') !== '' ? Number(readValue('voyageurs')) : null;
  const dateArrivee = readValue('availableStart', 'dateArrivee', 'date_arrivee') || '';
  const dateDepart = readValue('availableEnd', 'dateDepart', 'date_depart') || '';
  const equipements = (
    Array.isArray(query.equipements)
      ? query.equipements
      : String(readValue('equipements') || '').split(',')
  )
    .map((item) => String(item).trim())
    .filter(Boolean);
  const annulationGratuite = isTrue(readValue('annulationGratuite'));
  const bienNote = isTrue(readValue('bienNote'));
  const hoteVerifie = isTrue(readValue('hoteVerifie'));
  const limit = Math.min(24, Math.max(1, Number(readValue('limit') || 12)));
  const page = Math.max(1, Number(readValue('page') || 1));
  const offset =
    readValue('offset') !== undefined && readValue('offset') !== ''
      ? Math.max(0, Number(readValue('offset')))
      : (page - 1) * limit;
  const paginated =
    isTrue(readValue('paginated')) ||
    readValue('limit') !== undefined ||
    readValue('offset') !== undefined ||
    readValue('page') !== undefined;
  const sort = String(readValue('sort') || '').trim().toLowerCase();

  return {
    search,
    type,
    prixMin,
    prixMax,
    chambres,
    lits,
    voyageurs,
    dateArrivee,
    dateDepart,
    equipements,
    annulationGratuite,
    bienNote,
    hoteVerifie,
    limit,
    offset,
    paginated,
    sort,
  };
};

const buildQueryParts = (ctx) => {
  const conditions = [
    'l.est_supprime = FALSE',
    "l.validation_statut = 'valide'",
    'l.est_actif = TRUE',
  ];
  const params = [];
  const searchVectorSql = `
    (
      setweight(to_tsvector('simple', COALESCE(l.titre, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(l.ville, '')), 'A') ||
      setweight(to_tsvector('simple', COALESCE(l.adresse, '')), 'B') ||
      setweight(to_tsvector('simple', COALESCE(l.description, '')), 'C')
    )
  `;

  const push = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  let rankSql = '0';

  if (ctx.search) {
    const tsToken = push(ctx.search);
    const likeToken = push(`%${ctx.search}%`);
    const exactToken = tsToken;

    conditions.push(`(
      ${searchVectorSql} @@ plainto_tsquery('simple', ${tsToken})
      OR
      LOWER(l.titre) LIKE ${likeToken}
      OR LOWER(l.description) LIKE ${likeToken}
      OR LOWER(l.ville) LIKE ${likeToken}
      OR LOWER(l.adresse) LIKE ${likeToken}
    )`);

    rankSql = `
      (
        COALESCE(ts_rank_cd(${searchVectorSql}, plainto_tsquery('simple', ${tsToken})), 0) * 100 +
        CASE WHEN LOWER(l.ville) = ${exactToken} THEN 40 ELSE 0 END +
        CASE WHEN LOWER(l.titre) LIKE ${likeToken} THEN 25 ELSE 0 END +
        CASE WHEN LOWER(l.adresse) LIKE ${likeToken} THEN 15 ELSE 0 END +
        CASE WHEN LOWER(l.description) LIKE ${likeToken} THEN 5 ELSE 0 END
      )
    `;
  }

  if (ctx.type) {
    const token = push(ctx.type);
    conditions.push(`LOWER(l.type_logement) = LOWER(${token})`);
  }
  if (Number.isFinite(ctx.prixMin)) {
    const token = push(ctx.prixMin);
    conditions.push(`l.prix_par_nuit >= ${token}`);
  }
  if (Number.isFinite(ctx.prixMax)) {
    const token = push(ctx.prixMax);
    conditions.push(`l.prix_par_nuit <= ${token}`);
  }
  if (Number.isFinite(ctx.chambres)) {
    const token = push(ctx.chambres);
    conditions.push(`l.nb_chambres >= ${token}`);
  }
  if (Number.isFinite(ctx.lits)) {
    const token = push(ctx.lits);
    conditions.push(`l.nb_lits >= ${token}`);
  }
  if (Number.isFinite(ctx.voyageurs)) {
    const token = push(ctx.voyageurs);
    conditions.push(`l.capacite_accueil >= ${token}`);
  }
  if (ctx.annulationGratuite) {
    conditions.push(`l.politique_annulation = 'souple'`);
  }
  if (ctx.hoteVerifie) {
    conditions.push('u.est_verifie = TRUE');
  }
  if (ctx.bienNote) {
    conditions.push(`
      COALESCE((
        SELECT AVG(a2.note_logement)
        FROM avis a2
        WHERE a2.id_logement = l.id
          AND a2.est_visible = TRUE
      ), 0) >= 4.5
    `);
  }

  for (const equipement of ctx.equipements) {
    const token = push(equipement);
    conditions.push(`
      EXISTS (
        SELECT 1
        FROM logement_equipement le2
        WHERE le2.id_logement = l.id
          AND LOWER(le2.nom_equipement) = LOWER(${token})
      )
    `);
  }

  if (ctx.dateArrivee && ctx.dateDepart) {
    const startToken = push(ctx.dateArrivee);
    const endToken = push(ctx.dateDepart);

    conditions.push(`
      NOT EXISTS (
        SELECT 1
        FROM reservation r
        WHERE r.id_logement = l.id
          AND r.statut IN ('en_attente', 'confirmee', 'terminee')
          AND NOT (r.date_depart <= ${startToken} OR r.date_arrivee >= ${endToken})
      )
    `);

    conditions.push(`
      NOT EXISTS (
        SELECT 1
        FROM disponibilite d
        WHERE d.id_logement = l.id
          AND d.est_bloque = TRUE
          AND NOT (d.date_fin < ${startToken} OR d.date_debut >= ${endToken})
      )
    `);
  }

  let orderBy = 'l.date_creation DESC';
  if (ctx.sort === 'price_asc') orderBy = 'l.prix_par_nuit ASC, l.date_creation DESC';
  if (ctx.sort === 'price_desc') orderBy = 'l.prix_par_nuit DESC, l.date_creation DESC';
  if (ctx.sort === 'rating_desc') orderBy = 'note_moyenne DESC, l.date_creation DESC';
  if (ctx.sort === 'recent') orderBy = 'l.date_creation DESC';
  if (!ctx.sort && ctx.search) {
    orderBy = `search_rank DESC, note_moyenne DESC, l.date_creation DESC`;
  }

  const fromAndWhere = `
    FROM logement l
    JOIN utilisateur u ON u.id = l.id_hote
    LEFT JOIN logement_photo lp ON lp.id_logement = l.id
    LEFT JOIN logement_equipement le ON le.id_logement = l.id
    LEFT JOIN avis a ON a.id_logement = l.id AND a.est_visible = TRUE
    WHERE ${conditions.join(' AND ')}
  `;

  const selectSql = `
    SELECT
      l.*,
      u.nom AS hote_nom,
      u.prenom AS hote_prenom,
      u.photo_profil AS hote_photo,
      u.est_verifie AS hote_verifie,
      COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT lp.url_photo ORDER BY lp.url_photo), NULL), '{}') AS photos,
      COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT le.nom_equipement ORDER BY le.nom_equipement), NULL), '{}') AS equipements,
      COALESCE(ROUND(AVG(a.note_logement)::numeric, 2), 0) AS note_moyenne,
      COUNT(DISTINCT a.id) AS nb_avis,
      ${rankSql} AS search_rank
    ${fromAndWhere}
    GROUP BY l.id, u.id
    ORDER BY ${orderBy}
  `;

  const countSql = `
    SELECT COUNT(*)::int AS total
    FROM (
      SELECT l.id
      ${fromAndWhere}
      GROUP BY l.id, u.id
    ) counted
  `;

  return {
    params,
    selectSql,
    countSql,
  };
};

router.get('/', async (req, res) => {
  const ctx = buildSearchContext(req.query, req.originalUrl);
  const rawUrl = String(req.originalUrl || '');
  if (
    rawUrl.includes('paginated=') ||
    rawUrl.includes('limit=') ||
    rawUrl.includes('offset=') ||
    rawUrl.includes('page=')
  ) {
    ctx.paginated = true;
  }
  const { params, selectSql, countSql } = buildQueryParts(ctx);

  try {
    if (ctx.paginated) {
      const totalResult = await db.query(countSql, params);
      const pagedParams = [...params, ctx.limit, ctx.offset];
      const itemsResult = await db.query(
        `
          ${selectSql}
          LIMIT $${pagedParams.length - 1}
          OFFSET $${pagedParams.length}
        `,
        pagedParams
      );

      const total = totalResult.rows[0]?.total || 0;
      return res.json({
        items: itemsResult.rows,
        total,
        limit: ctx.limit,
        offset: ctx.offset,
        has_more: ctx.offset + ctx.limit < total,
      });
    }

    const result = await db.query(selectSql, params);
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/location-search', async (req, res) => {
  const q = String(req.query.q || '').trim();
  const apiKey = process.env.LOCATIONIQ_KEY || process.env.VITE_LOCATIONIQ_KEY;

  if (!apiKey) {
    return res.status(503).json({ erreur: 'LOCATIONIQ_KEY manquante dans .env.' });
  }
  if (q.length < 3) {
    return res.json([]);
  }

  try {
    const url = new URL('https://api.locationiq.com/v1/autocomplete');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('q', q);
    url.searchParams.set('limit', '5');
    url.searchParams.set('dedupe', '1');
    url.searchParams.set('countrycodes', 'dz');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', 'fr');
    url.searchParams.set('format', 'json');

    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ erreur: data.error || 'Erreur LocationIQ.' });
    }
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/:id/disponibilites', async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT id, date_debut, date_fin, est_bloque, source_blocage, note_interne
        FROM disponibilite
        WHERE id_logement = $1
        ORDER BY date_debut ASC
      `,
      [req.params.id]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await db.query(
      `
        ${listingSelect}
        WHERE l.id = $1
          AND l.est_supprime = FALSE
        ${listingGroupBy}
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Logement introuvable.' });
    }

    const listing = result.rows[0];
    const [reviewsResult, blocksResult] = await Promise.all([
      db.query(
        `
          SELECT
            a.*,
            u.nom AS voyageur_nom,
            u.prenom AS voyageur_prenom,
            u.photo_profil AS voyageur_photo
          FROM avis a
          JOIN utilisateur u ON u.id = a.id_voyageur
          WHERE a.id_logement = $1
            AND a.est_visible = TRUE
          ORDER BY a.date_avis DESC
        `,
        [req.params.id]
      ),
      db.query(
        `
          SELECT id, date_debut, date_fin, est_bloque, source_blocage
          FROM disponibilite
          WHERE id_logement = $1
          ORDER BY date_debut ASC
        `,
        [req.params.id]
      ),
    ]);

    return res.json({
      ...listing,
      avis: reviewsResult.rows,
      disponibilites: blocksResult.rows,
    });
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

module.exports = router;
