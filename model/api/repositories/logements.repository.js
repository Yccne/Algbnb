const database = require('./database.repository');
const { listingSelect, listingGroupBy } = require('../utils/listings');

const accentFromSql =
  "U&'\\00C0\\00C1\\00C2\\00C3\\00C4\\00C5\\00C7\\00C8\\00C9\\00CA\\00CB\\00CC\\00CD\\00CE\\00CF\\00D1\\00D2\\00D3\\00D4\\00D5\\00D6\\00D9\\00DA\\00DB\\00DC\\00DD\\0178\\00E0\\00E1\\00E2\\00E3\\00E4\\00E5\\00E7\\00E8\\00E9\\00EA\\00EB\\00EC\\00ED\\00EE\\00EF\\00F1\\00F2\\00F3\\00F4\\00F5\\00F6\\00F9\\00FA\\00FB\\00FC\\00FD\\00FF'";
const accentToSql = "'AAAAAACEEEEIIIINOOOOOUUUUYYaaaaaaceeeeiiiinooooouuuuyy'";
const normalizedSql = (sql) => `LOWER(translate(COALESCE(${sql}, ''), ${accentFromSql}, ${accentToSql}))`;

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
      setweight(to_tsvector('simple', COALESCE(l.adresse, '')), 'B')
    )
  `;
  const push = (value) => {
    params.push(value);
    return `$${params.length}`;
  };

  let rankSql = '0';
  let geoDistanceSql = 'NULL';
  if (ctx.geoBounds) {
    const centerLatToken = push(ctx.geoBounds.lat);
    const centerLngToken = push(ctx.geoBounds.lng);
    const minLatToken = push(ctx.geoBounds.minLat);
    const maxLatToken = push(ctx.geoBounds.maxLat);
    const minLngToken = push(ctx.geoBounds.minLng);
    const maxLngToken = push(ctx.geoBounds.maxLng);

    geoDistanceSql = `
      SQRT(
        POWER((l.latitude::numeric - ${centerLatToken}), 2) +
        POWER((l.longitude::numeric - ${centerLngToken}) * COS(RADIANS(${centerLatToken})), 2)
      )
    `;

    conditions.push(`
      l.latitude IS NOT NULL
      AND l.longitude IS NOT NULL
      AND l.latitude::numeric BETWEEN ${minLatToken} AND ${maxLatToken}
      AND l.longitude::numeric BETWEEN ${minLngToken} AND ${maxLngToken}
      AND ${centerLatToken} = ${centerLatToken}
      AND ${centerLngToken} = ${centerLngToken}
    `);
  }

  if (ctx.search) {
    const tsToken = push(ctx.search);
    const likeToken = push(`%${ctx.search}%`);
    const exactToken = tsToken;
    const normalizedTitre = normalizedSql('l.titre');
    const normalizedVille = normalizedSql('l.ville');
    const normalizedAdresse = normalizedSql('l.adresse');

    if (ctx.geoBounds) {
      conditions.push(`${tsToken} = ${tsToken} AND ${likeToken} = ${likeToken}`);
    } else {
      conditions.push(`(
        ${searchVectorSql} @@ plainto_tsquery('simple', ${tsToken})
        OR l.titre::text % ${tsToken}
        OR l.ville::text % ${tsToken}
        OR l.adresse::text % ${tsToken}
        OR ${normalizedTitre} LIKE ${likeToken}
        OR ${normalizedVille} LIKE ${likeToken}
        OR ${normalizedAdresse} LIKE ${likeToken}
      )`);
    }

    rankSql = `
      (
        COALESCE(ts_rank_cd(${searchVectorSql}, plainto_tsquery('simple', ${tsToken})), 0) * 100 +
        GREATEST(
          similarity(COALESCE(l.titre, '')::text, ${tsToken}) * 35,
          similarity(COALESCE(l.ville, '')::text, ${tsToken}) * 45,
          similarity(COALESCE(l.adresse, '')::text, ${tsToken}) * 25
        ) +
        CASE WHEN ${normalizedVille} = ${exactToken} THEN 40 ELSE 0 END +
        CASE WHEN ${normalizedTitre} LIKE ${likeToken} THEN 25 ELSE 0 END +
        CASE WHEN ${normalizedAdresse} LIKE ${likeToken} THEN 15 ELSE 0 END
      )
    `;
  }

  if (ctx.geoBounds) {
    const distanceRankSql = `GREATEST(0, 35 - (${geoDistanceSql} * 260))`;
    rankSql = rankSql === '0' ? distanceRankSql : `(${rankSql} + ${distanceRankSql})`;
  }

  if (ctx.type) conditions.push(`LOWER(l.type_logement) = LOWER(${push(ctx.type)})`);
  if (Number.isFinite(ctx.prixMin)) conditions.push(`l.prix_par_nuit >= ${push(ctx.prixMin)}`);
  if (Number.isFinite(ctx.prixMax)) conditions.push(`l.prix_par_nuit <= ${push(ctx.prixMax)}`);
  if (Number.isFinite(ctx.chambres)) conditions.push(`l.nb_chambres >= ${push(ctx.chambres)}`);
  if (Number.isFinite(ctx.lits)) conditions.push(`l.nb_lits >= ${push(ctx.lits)}`);
  if (Number.isFinite(ctx.voyageurs)) conditions.push(`l.capacite_accueil >= ${push(ctx.voyageurs)}`);
  if (ctx.annulationGratuite) conditions.push("l.politique_annulation = 'souple'");
  if (ctx.hoteVerifie) conditions.push('u.est_verifie = TRUE');
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
  if (!ctx.sort && ctx.geoBounds) {
    orderBy = 'search_rank DESC, geo_distance ASC, note_moyenne DESC, l.date_creation DESC';
  }
  if (!ctx.sort && ctx.search) {
    orderBy = 'search_rank DESC, note_moyenne DESC, l.date_creation DESC';
  }
  if (!ctx.sort && ctx.search && ctx.geoBounds) {
    orderBy = 'search_rank DESC, geo_distance ASC, note_moyenne DESC, l.date_creation DESC';
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
      ${geoDistanceSql} AS geo_distance,
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

  return { params, selectSql, countSql };
};

const list = async (ctx) => {
  const { params, selectSql } = buildQueryParts(ctx);
  const result = await database.query(selectSql, params);
  return result.rows;
};

const listPaginated = async (ctx) => {
  const { params, selectSql, countSql } = buildQueryParts(ctx);
  const totalResult = await database.query(countSql, params);
  const pagedParams = [...params, ctx.limit, ctx.offset];
  const itemsResult = await database.query(
    `
      ${selectSql}
      LIMIT $${pagedParams.length - 1}
      OFFSET $${pagedParams.length}
    `,
    pagedParams
  );
  return {
    items: itemsResult.rows,
    total: totalResult.rows[0]?.total || 0,
  };
};

const listMap = async (ctx) => {
  const rows = await list(ctx);
  return rows.filter((item) => item.latitude !== null && item.longitude !== null);
};

const findLocationSuggestions = async (searchText, limit = 5) => {
  const normalizedToken = String(searchText || '').trim().toLowerCase();
  if (!normalizedToken || normalizedToken.length < 2) return [];

  const normalizedVille = normalizedSql('l.ville');
  const result = await database.query(
    `
      SELECT
        l.ville,
        COUNT(*)::int AS nb_logements,
        AVG(l.latitude::numeric)::float AS lat,
        AVG(l.longitude::numeric)::float AS lon,
        MIN(l.latitude::numeric)::float AS min_lat,
        MAX(l.latitude::numeric)::float AS max_lat,
        MIN(l.longitude::numeric)::float AS min_lng,
        MAX(l.longitude::numeric)::float AS max_lng,
        MAX(similarity(${normalizedVille}, $1))::float AS score
      FROM logement l
      WHERE l.est_supprime = FALSE
        AND l.validation_statut = 'valide'
        AND l.est_actif = TRUE
        AND l.latitude IS NOT NULL
        AND l.longitude IS NOT NULL
        AND (
          ${normalizedVille} LIKE $2
          OR ${normalizedVille} % $1
          OR similarity(${normalizedVille}, $1) >= 0.25
        )
      GROUP BY l.ville
      ORDER BY
        CASE WHEN ${normalizedVille} = $1 THEN 1 ELSE 0 END DESC,
        score DESC,
        nb_logements DESC,
        l.ville ASC
      LIMIT $3
    `,
    [normalizedToken, `%${normalizedToken}%`, limit]
  );
  return result.rows;
};

const findAvailability = async (listingId) => {
  const result = await database.query(
    `
      SELECT id, date_debut, date_fin, est_bloque, source_blocage, note_interne
      FROM disponibilite
      WHERE id_logement = $1
      ORDER BY date_debut ASC
    `,
    [listingId]
  );
  return result.rows;
};

const findPublicDetail = async (listingId) => {
  const result = await database.query(
    `
      ${listingSelect}
      WHERE l.id = $1
        AND l.est_supprime = FALSE
      ${listingGroupBy}
    `,
    [listingId]
  );
  return result.rows[0] || null;
};

const findReviewsForDetail = async (listingId) => {
  const result = await database.query(
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
    [listingId]
  );
  return result.rows;
};

const findBlocksForDetail = async (listingId) => {
  const result = await database.query(
    `
      SELECT id, date_debut, date_fin, est_bloque, source_blocage
      FROM disponibilite
      WHERE id_logement = $1
      ORDER BY date_debut ASC
    `,
    [listingId]
  );
  return result.rows;
};

module.exports = {
  findAvailability,
  findBlocksForDetail,
  findLocationSuggestions,
  findPublicDetail,
  findReviewsForDetail,
  list,
  listMap,
  listPaginated,
};
