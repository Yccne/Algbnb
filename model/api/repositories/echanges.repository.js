const database = require('./database.repository');

const activeReservationStatuses = ['en_attente', 'confirmee', 'terminee'];
const activeExchangeStatuses = ['discussion', 'proposee', 'contre_proposee', 'contrepartie_proposee'];

const exchangeSelect = `
  SELECT
    e.*,
    ld.titre AS logement_demandeur_titre,
    ld.ville AS logement_demandeur_ville,
    ld.adresse AS logement_demandeur_adresse,
    lr.titre AS logement_receveur_titre,
    lr.ville AS logement_receveur_ville,
    lr.adresse AS logement_receveur_adresse,
    hd.nom AS hote_demandeur_nom,
    hd.prenom AS hote_demandeur_prenom,
    hd.email AS hote_demandeur_email,
    hr.nom AS hote_receveur_nom,
    hr.prenom AS hote_receveur_prenom,
    hr.email AS hote_receveur_email,
    COALESCE((
      SELECT ARRAY_REMOVE(ARRAY_AGG(lp.url_photo ORDER BY lp.ordre_affichage), NULL)
      FROM logement_photo lp
      WHERE lp.id_logement = ld.id
    ), '{}') AS logement_demandeur_photos,
    COALESCE((
      SELECT ARRAY_REMOVE(ARRAY_AGG(lp.url_photo ORDER BY lp.ordre_affichage), NULL)
      FROM logement_photo lp
      WHERE lp.id_logement = lr.id
    ), '{}') AS logement_receveur_photos
  FROM echange_logement e
  JOIN logement ld ON ld.id = e.id_logement_demandeur
  JOIN logement lr ON lr.id = e.id_logement_receveur
  JOIN utilisateur hd ON hd.id = e.id_hote_demandeur
  JOIN utilisateur hr ON hr.id = e.id_hote_receveur
`;

const listByHost = async (hostId) => {
  const result = await database.query(
    `
      ${exchangeSelect}
      WHERE e.id_hote_demandeur = $1 OR e.id_hote_receveur = $1
      ORDER BY e.date_mise_a_jour DESC, e.date_creation DESC
    `,
    [hostId]
  );
  return result.rows;
};

const listAll = async (filters = {}) => {
  const params = [];
  const where = [];
  if (filters.statut) {
    params.push(filters.statut);
    where.push(`e.statut = $${params.length}`);
  }
  if (filters.search) {
    params.push(`%${String(filters.search).trim().toLowerCase()}%`);
    where.push(`
      LOWER(CONCAT_WS(' ', ld.titre, lr.titre, ld.ville, lr.ville, hd.nom, hd.prenom, hr.nom, hr.prenom))
      LIKE $${params.length}
    `);
  }
  const limit = Math.min(Number(filters.limit) || 120, 250);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  params.push(limit, offset);

  const result = await database.query(
    `
      ${exchangeSelect}
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY e.date_mise_a_jour DESC, e.date_creation DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `,
    params
  );
  return result.rows;
};

const listOpenListings = async (hostId) => {
  const result = await database.query(
    `
      SELECT
        l.*,
        u.nom AS hote_nom,
        u.prenom AS hote_prenom,
        u.photo_profil AS hote_photo,
        lep.message AS echange_message,
        lep.date_mise_a_jour AS echange_date_mise_a_jour,
        COALESCE((
          SELECT ARRAY_REMOVE(ARRAY_AGG(lp.url_photo ORDER BY lp.ordre_affichage), NULL)
          FROM logement_photo lp
          WHERE lp.id_logement = l.id
        ), '{}') AS photos
      FROM logement l
      JOIN utilisateur u ON u.id = l.id_hote
      JOIN logement_echange_preference lep ON lep.id_logement = l.id AND lep.est_ouvert = TRUE
      WHERE l.est_supprime = FALSE
        AND l.est_actif = TRUE
        AND l.validation_statut = 'valide'
        AND l.id_hote <> $1
      ORDER BY lep.date_mise_a_jour DESC, l.date_creation DESC
    `,
    [hostId]
  );
  return result.rows;
};

const findListingForExchange = async (listingId) => {
  const result = await database.query(
    `
      SELECT
        l.*,
        u.role_type AS hote_role,
        u.nom AS hote_nom,
        u.prenom AS hote_prenom,
        COALESCE(lep.est_ouvert, FALSE) AS echange_ouvert,
        lep.message AS echange_message
      FROM logement l
      JOIN utilisateur u ON u.id = l.id_hote
      LEFT JOIN logement_echange_preference lep ON lep.id_logement = l.id
      WHERE l.id = $1
        AND l.est_supprime = FALSE
      LIMIT 1
    `,
    [listingId]
  );
  return result.rows[0] || null;
};

const setPreference = async ({ listingId, isOpen, message }) => {
  const result = await database.query(
    `
      INSERT INTO logement_echange_preference (id_logement, est_ouvert, message, date_mise_a_jour)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (id_logement)
      DO UPDATE SET est_ouvert = EXCLUDED.est_ouvert,
                    message = EXCLUDED.message,
                    date_mise_a_jour = NOW()
      RETURNING *
    `,
    [listingId, isOpen, message]
  );
  return result.rows[0];
};

const findActiveBetween = async ({ requesterListingId, receiverListingId }) => {
  const result = await database.query(
    `
      SELECT *
      FROM echange_logement
      WHERE statut = ANY($3::text[])
        AND (
          (id_logement_demandeur = $1 AND id_logement_receveur = $2)
          OR (id_logement_demandeur = $2 AND id_logement_receveur = $1)
        )
      LIMIT 1
    `,
    [requesterListingId, receiverListingId, activeExchangeStatuses]
  );
  return result.rows[0] || null;
};

const createExchange = async ({ requesterListing, receiverListing, conversationId, actorId }) => {
  const result = await database.query(
    `
      INSERT INTO echange_logement (
        id_logement_demandeur, id_logement_receveur,
        id_hote_demandeur, id_hote_receveur,
        id_conversation, dernier_acteur_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      requesterListing.id,
      receiverListing.id,
      requesterListing.id_hote,
      receiverListing.id_hote,
      conversationId,
      actorId,
    ]
  );
  return result.rows[0];
};

const findById = async (exchangeId) => {
  const result = await database.query(
    `
      ${exchangeSelect}
      WHERE e.id = $1
      LIMIT 1
    `,
    [exchangeId]
  );
  return result.rows[0] || null;
};

const updateRequesterProposal = async ({ exchangeId, startDate, endDate, actorId }) => {
  const result = await database.query(
    `
      UPDATE echange_logement
      SET demandeur_date_debut = $1,
          demandeur_date_fin = $2,
          receveur_date_debut = NULL,
          receveur_date_fin = NULL,
          statut = 'proposee',
          motif_refus = NULL,
          dernier_acteur_id = $3,
          date_mise_a_jour = NOW()
      WHERE id = $4
      RETURNING *
    `,
    [startDate, endDate, actorId, exchangeId]
  );
  return result.rows[0] || null;
};

const updateReceiverResponse = async ({
  exchangeId,
  decision,
  receiverStartDate,
  receiverEndDate,
  requesterStartDate,
  requesterEndDate,
  reason,
  actorId,
}) => {
  const accepted = decision === 'accepter';
  const counter = decision === 'contre_proposer';
  const result = await database.query(
    `
      UPDATE echange_logement
      SET demandeur_date_debut = CASE WHEN $2 = TRUE THEN $3 ELSE demandeur_date_debut END,
          demandeur_date_fin = CASE WHEN $2 = TRUE THEN $4 ELSE demandeur_date_fin END,
          receveur_date_debut = CASE WHEN $1 = TRUE OR $2 = TRUE THEN $5 ELSE receveur_date_debut END,
          receveur_date_fin = CASE WHEN $1 = TRUE OR $2 = TRUE THEN $6 ELSE receveur_date_fin END,
          statut = CASE
            WHEN $1 = TRUE THEN 'contrepartie_proposee'
            WHEN $2 = TRUE THEN 'contre_proposee'
            ELSE 'refusee'
          END,
          motif_refus = CASE WHEN $1 = TRUE OR $2 = TRUE THEN NULL ELSE $7 END,
          dernier_acteur_id = $8,
          date_mise_a_jour = NOW(),
          date_decision = CASE WHEN $1 = TRUE OR $2 = TRUE THEN NULL ELSE NOW() END
      WHERE id = $9
      RETURNING *
    `,
    [
      accepted,
      counter,
      requesterStartDate || null,
      requesterEndDate || null,
      receiverStartDate || null,
      receiverEndDate || null,
      reason || null,
      actorId,
      exchangeId,
    ]
  );
  return result.rows[0] || null;
};

const updateFinalRefusal = async ({ exchangeId, reason, actorId }) => {
  const result = await database.query(
    `
      UPDATE echange_logement
      SET statut = 'refusee',
          motif_refus = $1,
          dernier_acteur_id = $2,
          date_mise_a_jour = NOW(),
          date_decision = NOW()
      WHERE id = $3
      RETURNING *
    `,
    [reason || null, actorId, exchangeId]
  );
  return result.rows[0] || null;
};

const cancel = async ({ exchangeId, reason, actorId }) => {
  const result = await database.query(
    `
      UPDATE echange_logement
      SET statut = 'annulee',
          motif_refus = $1,
          dernier_acteur_id = $2,
          date_mise_a_jour = NOW(),
          date_decision = NOW()
      WHERE id = $3
      RETURNING *
    `,
    [reason || null, actorId, exchangeId]
  );
  return result.rows[0] || null;
};

const hasDateConflict = async ({ listingId, startDate, endDate }) => {
  const reservationResult = await database.query(
    `
      SELECT 1
      FROM reservation r
      WHERE r.id_logement = $1
        AND r.statut = ANY($2::text[])
        AND NOT (r.date_depart <= $3 OR r.date_arrivee >= $4)
      LIMIT 1
    `,
    [listingId, activeReservationStatuses, startDate, endDate]
  );
  if (reservationResult.rows.length > 0) return true;

  const blockResult = await database.query(
    `
      SELECT 1
      FROM disponibilite d
      WHERE d.id_logement = $1
        AND d.est_bloque = TRUE
        AND NOT (d.date_fin < $2 OR d.date_debut >= $3)
      LIMIT 1
    `,
    [listingId, startDate, endDate]
  );
  return blockResult.rows.length > 0;
};

const acceptFinal = async ({ exchange, actorId }) =>
  database.withTransaction(async (client) => {
    const updated = await client.query(
      `
        UPDATE echange_logement
        SET statut = 'acceptee',
            dernier_acteur_id = $1,
            date_mise_a_jour = NOW(),
            date_decision = NOW()
        WHERE id = $2
        RETURNING *
      `,
      [actorId, exchange.id]
    );

    await client.query(
      `
        INSERT INTO disponibilite (id_logement, date_debut, date_fin, est_bloque, source_blocage, note_interne)
        VALUES
          ($1, $2, $3, TRUE, 'echange', $4),
          ($5, $6, $7, TRUE, 'echange', $4)
      `,
      [
        exchange.id_logement_receveur,
        exchange.demandeur_date_debut,
        exchange.demandeur_date_fin,
        `Echange de logements #${exchange.id}`,
        exchange.id_logement_demandeur,
        exchange.receveur_date_debut,
        exchange.receveur_date_fin,
      ]
    );

    return updated.rows[0] || null;
  });

module.exports = {
  acceptFinal,
  cancel,
  createExchange,
  findActiveBetween,
  findById,
  findListingForExchange,
  hasDateConflict,
  listAll,
  listByHost,
  listOpenListings,
  setPreference,
  updateFinalRefusal,
  updateReceiverResponse,
  updateRequesterProposal,
};
