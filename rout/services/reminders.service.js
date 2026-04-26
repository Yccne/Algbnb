const remindersRepository = require('../repositories/reminders.repository');
const notificationsService = require('./notifications.service');
const { queueUserMail } = require('../utils/notifications');

const createReminder = async ({ reservation, user, type, contenu, subject, text }) => {
  if (!user?.id) return false;

  const alreadySent = await remindersRepository.reminderAlreadySent({
    userId: user.id,
    type,
    reservationId: reservation.id,
  });
  if (alreadySent) return false;

  await notificationsService.insertNotification(null, user.id, type, contenu, {
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
  const reservations = await remindersRepository.findUpcomingConfirmedReservations();

  for (const reservation of reservations) {
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
