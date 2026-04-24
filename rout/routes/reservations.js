const express = require('express');
const db = require('../db');
const { verifierToken, estHote } = require('../middlewares/ann');
const { insertNotification, queueUserMail } = require('../utils/notifications');

const router = express.Router();

const toDate = (value) => new Date(`${value}T00:00:00Z`);
const calculateNights = (start, end) =>
  Math.max(1, Math.round((toDate(end) - toDate(start)) / (1000 * 60 * 60 * 24)));

const activeReservationStatuses = ['en_attente', 'confirmee', 'terminee'];

const reservationSelect = `
  SELECT
    r.*,
    l.titre,
    l.adresse,
    l.ville,
    l.prix_par_nuit AS logement_prix_par_nuit,
    l.id_hote,
    av.id AS review_id,
    (av.id IS NOT NULL) AS has_review,
    u.nom AS hote_nom,
    u.prenom AS hote_prenom,
    COALESCE((
      SELECT ARRAY_REMOVE(ARRAY_AGG(lp.url_photo ORDER BY lp.ordre_affichage), NULL)
      FROM logement_photo lp
      WHERE lp.id_logement = l.id
    ), '{}') AS photos
  FROM reservation r
  JOIN logement l ON l.id = r.id_logement
  JOIN utilisateur u ON u.id = l.id_hote
  LEFT JOIN avis av ON av.id_reservation = r.id
`;

const fetchUser = async (userId) => {
  const result = await db.query(
    `
      SELECT id, nom, prenom, email
      FROM utilisateur
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );
  return result.rows[0] || null;
};

const queueReservationEmails = async (emailJobs) => {
  if (emailJobs.length === 0) {
    return;
  }
  await Promise.allSettled(emailJobs);
};

router.get('/me', verifierToken, async (req, res) => {
  try {
    const result = await db.query(
      `
        ${reservationSelect}
        WHERE r.id_voyageur = $1
        ORDER BY r.date_reservation DESC
      `,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/voyageur/:id', verifierToken, async (req, res) => {
  if (String(req.user.id) !== String(req.params.id) && req.user.role !== 'admin') {
    return res.status(403).json({ erreur: 'Acces refuse.' });
  }

  try {
    const result = await db.query(
      `
        ${reservationSelect}
        WHERE r.id_voyageur = $1
        ORDER BY r.date_reservation DESC
      `,
      [req.params.id]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/host/me', verifierToken, estHote, async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT
          r.*,
          l.titre,
          l.ville,
          v.nom AS voyageur_nom,
          v.prenom AS voyageur_prenom,
          v.photo_profil AS voyageur_photo
        FROM reservation r
        JOIN logement l ON l.id = r.id_logement
        JOIN utilisateur v ON v.id = r.id_voyageur
        WHERE l.id_hote = $1
        ORDER BY r.date_reservation DESC
      `,
      [req.user.id]
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.post('/', verifierToken, async (req, res) => {
  const {
    id_logement,
    logementId,
    date_arrivee,
    date_depart,
    dateArrivee,
    dateDepart,
    nb_voyageurs,
    voyageurs,
  } = req.body;

  const logementIdValue = id_logement || logementId;
  const startDate = date_arrivee || dateArrivee;
  const endDate = date_depart || dateDepart;
  const guestCount = Number(nb_voyageurs || voyageurs || 1);

  if (!logementIdValue || !startDate || !endDate) {
    return res.status(400).json({ erreur: 'Logement, dates et voyageurs sont requis.' });
  }

  try {
    const [listingResult, voyageur] = await Promise.all([
      db.query(
        `
          SELECT
            l.*,
            h.nom AS hote_nom,
            h.prenom AS hote_prenom,
            h.email AS hote_email
          FROM logement l
          JOIN utilisateur h ON h.id = l.id_hote
          WHERE l.id = $1
            AND l.est_supprime = FALSE
            AND l.est_actif = TRUE
            AND l.validation_statut = 'valide'
          LIMIT 1
        `,
        [logementIdValue]
      ),
      fetchUser(req.user.id),
    ]);

    if (listingResult.rows.length === 0) {
      return res.status(404).json({ erreur: 'Logement indisponible.' });
    }

    const listing = listingResult.rows[0];
    if (guestCount > listing.capacite_accueil) {
      return res.status(400).json({ erreur: 'Capacite depassee pour ce logement.' });
    }

    const conflictResult = await db.query(
      `
        SELECT 1
        FROM reservation r
        WHERE r.id_logement = $1
          AND r.statut = ANY($2::text[])
          AND NOT (r.date_depart <= $3 OR r.date_arrivee >= $4)
        LIMIT 1
      `,
      [logementIdValue, activeReservationStatuses, startDate, endDate]
    );

    if (conflictResult.rows.length > 0) {
      return res.status(400).json({ erreur: 'Ce logement a deja une reservation sur cette periode.' });
    }

    const blockedResult = await db.query(
      `
        SELECT 1
        FROM disponibilite d
        WHERE d.id_logement = $1
          AND d.est_bloque = TRUE
          AND NOT (d.date_fin < $2 OR d.date_debut >= $3)
        LIMIT 1
      `,
      [logementIdValue, startDate, endDate]
    );

    if (blockedResult.rows.length > 0) {
      return res.status(400).json({ erreur: 'Ces dates sont bloquees par l hote.' });
    }

    const nights = calculateNights(startDate, endDate);
    const pricePerNight = Number(listing.prix_par_nuit);
    const subTotal = Number((pricePerNight * nights).toFixed(2));
    const serviceFee = Number(((subTotal * Number(listing.frais_service_pct || 0)) / 100).toFixed(2));
    const total = Number((subTotal + serviceFee).toFixed(2));
    const status = listing.mode_reservation === 'instantanee' ? 'confirmee' : 'en_attente';

    const client = await db.getClient();
    try {
      await client.query('BEGIN');

      const reservationResult = await client.query(
        `
          INSERT INTO reservation (
            id_voyageur, id_logement, date_arrivee, date_depart, nb_voyageurs,
            prix_par_nuit, sous_total, frais_service, montant_total,
            statut, politique_annulation, mode_confirmation
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `,
        [
          req.user.id,
          logementIdValue,
          startDate,
          endDate,
          guestCount,
          pricePerNight,
          subTotal,
          serviceFee,
          total,
          status,
          listing.politique_annulation,
          listing.mode_reservation,
        ]
      );

      const reservation = reservationResult.rows[0];

      if (status === 'confirmee') {
        await client.query(
          `
            INSERT INTO disponibilite (id_logement, date_debut, date_fin, est_bloque, source_blocage, note_interne)
            VALUES ($1, $2, $3, TRUE, 'reservation', $4)
          `,
          [logementIdValue, startDate, endDate, `Reservation #${reservation.id}`]
        );
      }

      await insertNotification(
        client,
        listing.id_hote,
        'reservation',
        status === 'confirmee'
          ? `Nouvelle reservation confirmee pour ${listing.titre}.`
          : `Nouvelle demande de reservation pour ${listing.titre}.`,
        { reservationId: reservation.id, logementId: listing.id }
      );
      await insertNotification(
        client,
        req.user.id,
        'reservation',
        status === 'confirmee'
          ? `Votre reservation pour ${listing.titre} est confirmee.`
          : `Votre demande de reservation pour ${listing.titre} est en attente.`,
        { reservationId: reservation.id, logementId: listing.id }
      );

      await client.query('COMMIT');

      const emailJobs = [];
      queueUserMail(
        emailJobs,
        { email: listing.hote_email },
        status === 'confirmee' ? `Nouvelle reservation confirmee - ${listing.titre}` : `Nouvelle demande - ${listing.titre}`,
        status === 'confirmee'
          ? `Une reservation vient d etre confirmee pour ${listing.titre} du ${startDate} au ${endDate}.`
          : `Une nouvelle demande de reservation a ete recue pour ${listing.titre} du ${startDate} au ${endDate}.`
      );
      queueUserMail(
        emailJobs,
        voyageur,
        status === 'confirmee' ? `Reservation confirmee - ${listing.titre}` : `Demande en attente - ${listing.titre}`,
        status === 'confirmee'
          ? `Votre reservation pour ${listing.titre} est confirmee du ${startDate} au ${endDate}.`
          : `Votre demande pour ${listing.titre} est en attente de validation du ${startDate} au ${endDate}.`
      );
      await queueReservationEmails(emailJobs);

      return res.status(201).json(reservation);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.patch('/:id/annuler', verifierToken, async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT
          r.*,
          l.id_hote,
          l.titre,
          h.email AS hote_email,
          h.nom AS hote_nom,
          h.prenom AS hote_prenom,
          v.email AS voyageur_email,
          v.nom AS voyageur_nom,
          v.prenom AS voyageur_prenom
        FROM reservation r
        JOIN logement l ON l.id = r.id_logement
        JOIN utilisateur h ON h.id = l.id_hote
        JOIN utilisateur v ON v.id = r.id_voyageur
        WHERE r.id = $1
        LIMIT 1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Reservation introuvable.' });
    }

    const reservation = result.rows[0];
    const isTraveler = String(reservation.id_voyageur) === String(req.user.id);
    const isHost = String(reservation.id_hote) === String(req.user.id);
    if (!isTraveler && !isHost && req.user.role !== 'admin') {
      return res.status(403).json({ erreur: 'Acces refuse.' });
    }

    const newStatus = isHost ? 'annulee_hote' : 'annulee_voyageur';
    const updatedResult = await db.query(
      `
        UPDATE reservation
        SET statut = $1, date_annulation = NOW(), motif_annulation = $2
        WHERE id = $3
        RETURNING *
      `,
      [newStatus, req.body.motif_annulation || null, req.params.id]
    );

    await db.query(
      `
        DELETE FROM disponibilite
        WHERE id_logement = $1
          AND source_blocage = 'reservation'
          AND date_debut = $2
          AND date_fin = $3
      `,
      [reservation.id_logement, reservation.date_arrivee, reservation.date_depart]
    );

    const recipientId = isHost ? reservation.id_voyageur : reservation.id_hote;
    const recipientEmail = isHost ? reservation.voyageur_email : reservation.hote_email;
    const recipient = { email: recipientEmail };
    const contenu = isHost
      ? `Votre reservation pour ${reservation.titre} a ete annulee par l hote.`
      : `La reservation pour ${reservation.titre} a ete annulee par le voyageur.`;

    await insertNotification(db, recipientId, 'annulation', contenu, {
      reservationId: reservation.id,
      logementId: reservation.id_logement,
    });

    const emailJobs = [];
    queueUserMail(
      emailJobs,
      recipient,
      `Annulation de reservation - ${reservation.titre}`,
      contenu
    );
    await queueReservationEmails(emailJobs);

    return res.json(updatedResult.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.patch('/:id/statut', verifierToken, estHote, async (req, res) => {
  const { statut } = req.body;
  if (!['confirmee', 'refusee', 'terminee'].includes(statut)) {
    return res.status(400).json({ erreur: 'Statut invalide.' });
  }

  try {
    const result = await db.query(
      `
        SELECT
          r.*,
          l.id_hote,
          l.id AS logement_id,
          l.titre,
          v.email AS voyageur_email,
          v.nom AS voyageur_nom,
          v.prenom AS voyageur_prenom
        FROM reservation r
        JOIN logement l ON l.id = r.id_logement
        JOIN utilisateur v ON v.id = r.id_voyageur
        WHERE r.id = $1
        LIMIT 1
      `,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Reservation introuvable.' });
    }

    const reservation = result.rows[0];
    if (String(reservation.id_hote) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ erreur: 'Acces refuse.' });
    }

    const client = await db.getClient();
    try {
      await client.query('BEGIN');
      const updated = await client.query(
        'UPDATE reservation SET statut = $1 WHERE id = $2 RETURNING *',
        [statut, req.params.id]
      );

      if (statut === 'confirmee') {
        await client.query(
          `
            INSERT INTO disponibilite (id_logement, date_debut, date_fin, est_bloque, source_blocage, note_interne)
            VALUES ($1, $2, $3, TRUE, 'reservation', $4)
            ON CONFLICT DO NOTHING
          `,
          [reservation.logement_id, reservation.date_arrivee, reservation.date_depart, `Reservation #${reservation.id}`]
        );
      }

      if (statut === 'refusee') {
        await client.query(
          `
            DELETE FROM disponibilite
            WHERE id_logement = $1
              AND source_blocage = 'reservation'
              AND date_debut = $2
              AND date_fin = $3
          `,
          [reservation.logement_id, reservation.date_arrivee, reservation.date_depart]
        );
      }

      await insertNotification(
        client,
        reservation.id_voyageur,
        'reservation',
        statut === 'confirmee'
          ? `Votre reservation pour ${reservation.titre} a ete confirmee.`
          : statut === 'refusee'
            ? `Votre reservation pour ${reservation.titre} a ete refusee.`
            : `Votre reservation pour ${reservation.titre} est marquee comme terminee.`,
        { reservationId: reservation.id, logementId: reservation.logement_id }
      );

      await client.query('COMMIT');

      const emailJobs = [];
      queueUserMail(
        emailJobs,
        { email: reservation.voyageur_email },
        statut === 'confirmee'
          ? `Reservation confirmee - ${reservation.titre}`
          : statut === 'refusee'
            ? `Reservation refusee - ${reservation.titre}`
            : `Sejour termine - ${reservation.titre}`,
        statut === 'confirmee'
          ? `Votre reservation pour ${reservation.titre} a ete confirmee.`
          : statut === 'refusee'
            ? `Votre reservation pour ${reservation.titre} a ete refusee.`
            : `Votre reservation pour ${reservation.titre} est maintenant terminee.`
      );
      await queueReservationEmails(emailJobs);

      return res.json(updated.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

module.exports = router;
