const db = require('../db');
const { insertNotification, queueUserMail } = require('./notifications');

const reminderAlreadySent = async (userId, type, reservationId) => {
  const result = await db.query(
    `
      SELECT 1
      FROM notification
      WHERE id_utilisateur = $1
        AND type = $2
        AND meta ->> 'reservationId' = $3
      LIMIT 1
    `,
    [userId, type, String(reservationId)]
  );

  return result.rows.length > 0;
};

const createReminder = async ({ reservation, user, type, contenu, subject, text }) => {
  if (!user?.id) {
    return false;
  }

  const alreadySent = await reminderAlreadySent(user.id, type, reservation.id);
  if (alreadySent) {
    return false;
  }

  await insertNotification(db, user.id, type, contenu, {
    reservationId: reservation.id,
    logementId: reservation.id_logement,
    dateArrivee: reservation.date_arrivee,
    dateDepart: reservation.date_depart,
  });

  const emailJobs = [];
  queueUserMail(emailJobs, user, subject, text);
  await Promise.allSettled(emailJobs);
  return true;
};

const runStayReminderSweep = async () => {
  const result = await db.query(
    `
      SELECT
        r.id,
        r.id_logement,
        r.date_arrivee,
        r.date_depart,
        r.nb_voyageurs,
        l.titre,
        l.ville,
        h.id AS hote_id,
        h.nom AS hote_nom,
        h.prenom AS hote_prenom,
        h.email AS hote_email,
        v.id AS voyageur_id,
        v.nom AS voyageur_nom,
        v.prenom AS voyageur_prenom,
        v.email AS voyageur_email
      FROM reservation r
      JOIN logement l ON l.id = r.id_logement
      JOIN utilisateur h ON h.id = l.id_hote
      JOIN utilisateur v ON v.id = r.id_voyageur
      WHERE r.statut = 'confirmee'
        AND r.date_arrivee >= CURRENT_DATE
        AND r.date_arrivee <= CURRENT_DATE + INTERVAL '3 days'
      ORDER BY r.date_arrivee ASC
    `
  );

  for (const reservation of result.rows) {
    const arrivee = new Date(`${reservation.date_arrivee}T00:00:00`);
    const hoursUntilArrival = (arrivee.getTime() - Date.now()) / (1000 * 60 * 60);
    const voyageur = {
      id: reservation.voyageur_id,
      email: reservation.voyageur_email,
      prenom: reservation.voyageur_prenom,
      nom: reservation.voyageur_nom,
    };
    const hote = {
      id: reservation.hote_id,
      email: reservation.hote_email,
      prenom: reservation.hote_prenom,
      nom: reservation.hote_nom,
    };

    if (hoursUntilArrival <= 24) {
      await createReminder({
        reservation,
        user: voyageur,
        type: 'rappel_sejour_24h',
        contenu: `Rappel : votre sejour pour ${reservation.titre} commence dans moins de 24h.`,
        subject: `Rappel de sejour - ${reservation.titre}`,
        text: `Votre sejour a ${reservation.titre} (${reservation.ville}) commence le ${reservation.date_arrivee}.`,
      });

      await createReminder({
        reservation,
        user: hote,
        type: 'rappel_hote_24h',
        contenu: `Rappel : l'arrivee du voyageur pour ${reservation.titre} est prevue dans moins de 24h.`,
        subject: `Arrivee a venir - ${reservation.titre}`,
        text: `Le voyageur est attendu pour ${reservation.titre} le ${reservation.date_arrivee}.`,
      });
      continue;
    }

    if (hoursUntilArrival <= 72) {
      await createReminder({
        reservation,
        user: voyageur,
        type: 'rappel_sejour_72h',
        contenu: `Rappel : votre sejour pour ${reservation.titre} approche.`,
        subject: `Votre sejour approche - ${reservation.titre}`,
        text: `Votre reservation pour ${reservation.titre} (${reservation.ville}) commence le ${reservation.date_arrivee}.`,
      });

      await createReminder({
        reservation,
        user: hote,
        type: 'rappel_hote_72h',
        contenu: `Rappel : une arrivee est prevue bientot pour ${reservation.titre}.`,
        subject: `Sejour a venir - ${reservation.titre}`,
        text: `Une reservation confirmee arrive bientot pour ${reservation.titre}, le ${reservation.date_arrivee}.`,
      });
    }
  }
};

const startReminderScheduler = () => {
  if (String(process.env.DISABLE_REMINDER_SCHEDULER || 'false') === 'true') {
    return null;
  }

  const intervalMs = Number(process.env.REMINDER_INTERVAL_MS || 30 * 60 * 1000);

  setTimeout(() => {
    runStayReminderSweep().catch((error) => {
      console.error('[reminders] initial sweep failed:', error.message);
    });
  }, 10_000);

  return setInterval(() => {
    runStayReminderSweep().catch((error) => {
      console.error('[reminders] scheduled sweep failed:', error.message);
    });
  }, intervalMs);
};

module.exports = {
  runStayReminderSweep,
  startReminderScheduler,
};
