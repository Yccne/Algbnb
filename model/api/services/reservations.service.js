const reservationsRepository = require('../repositories/reservations.repository');
const notificationsService = require('./notifications.service');
const { queueUserMail } = require('../utils/notifications');
const {
  validateCreateReservationPayload,
  validateReservationStatus,
} = require('../validators/reservations.validator');
const { badRequest, forbidden, notFound } = require('../utils/httpError');

const toDate = (value) => new Date(`${value}T00:00:00Z`);
const calculateNights = (start, end) =>
  Math.max(1, Math.round((toDate(end) - toDate(start)) / (1000 * 60 * 60 * 24)));

const queueReservationEmails = async (emailJobs) => {
  if (emailJobs.length > 0) {
    await Promise.allSettled(emailJobs);
  }
};

const listMine = (userId) => reservationsRepository.listByTraveler(userId);

const listByTraveler = ({ currentUser, travelerId }) => {
  if (String(currentUser.id) !== String(travelerId) && currentUser.role !== 'admin') {
    throw forbidden('Acces refuse.');
  }
  return reservationsRepository.listByTraveler(travelerId);
};

const listHostMine = (hostId) => reservationsRepository.listByHost(hostId);

const create = async ({ currentUser, payload }) => {
  const { logementId, startDate, endDate, guestCount } = validateCreateReservationPayload(payload);
  const [listing, voyageur] = await Promise.all([
    reservationsRepository.findAvailableListing(logementId),
    reservationsRepository.findUser(currentUser.id),
  ]);

  if (!listing) throw notFound('Logement indisponible.');
  if (guestCount > listing.capacite_accueil) throw badRequest('Capacite depassee pour ce logement.');
  if (await reservationsRepository.hasReservationConflict({ listingId: logementId, startDate, endDate })) {
    throw badRequest('Ce logement a deja une reservation sur cette periode.');
  }
  if (await reservationsRepository.hasBlockedAvailability({ listingId: logementId, startDate, endDate })) {
    throw badRequest('Ces dates sont bloquees par l hote.');
  }

  const nights = calculateNights(startDate, endDate);
  const pricePerNight = Number(listing.prix_par_nuit);
  const subTotal = Number((pricePerNight * nights).toFixed(2));
  const serviceFee = Number(((subTotal * Number(listing.frais_service_pct || 0)) / 100).toFixed(2));
  const total = Number((subTotal + serviceFee).toFixed(2));
  const status = listing.mode_reservation === 'instantanee' ? 'confirmee' : 'en_attente';

  const reservation = await reservationsRepository.createReservation({
    reservation: {
      travelerId: currentUser.id,
      listingId: logementId,
      startDate,
      endDate,
      guestCount,
      pricePerNight,
      subTotal,
      serviceFee,
      total,
      status,
      cancellationPolicy: listing.politique_annulation,
      confirmationMode: listing.mode_reservation,
    },
    blockDates: status === 'confirmee',
    notifications: (created) => [
      {
        userId: listing.id_hote,
        type: 'reservation',
        contenu:
          status === 'confirmee'
            ? `Nouvelle reservation confirmee pour ${listing.titre}.`
            : `Nouvelle demande de reservation pour ${listing.titre}.`,
        meta: { reservationId: created.id, logementId: listing.id },
      },
      {
        userId: currentUser.id,
        type: 'reservation',
        contenu:
          status === 'confirmee'
            ? `Votre reservation pour ${listing.titre} est confirmee.`
            : `Votre demande de reservation pour ${listing.titre} est en attente.`,
        meta: { reservationId: created.id, logementId: listing.id },
      },
    ],
  });

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
  return reservation;
};

const cancel = async ({ currentUser, reservationId, reason }) => {
  const reservation = await reservationsRepository.findReservationForCancellation(reservationId);
  if (!reservation) throw notFound('Reservation introuvable.');

  const isTraveler = String(reservation.id_voyageur) === String(currentUser.id);
  const isHost = String(reservation.id_hote) === String(currentUser.id);
  if (!isTraveler && !isHost && currentUser.role !== 'admin') {
    throw forbidden('Acces refuse.');
  }

  const status = isHost ? 'annulee_hote' : 'annulee_voyageur';
  const updated = await reservationsRepository.cancelReservation({ reservation, status, reason });
  const recipientId = isHost ? reservation.id_voyageur : reservation.id_hote;
  const recipientEmail = isHost ? reservation.voyageur_email : reservation.hote_email;
  const contenu = isHost
    ? `Votre reservation pour ${reservation.titre} a ete annulee par l hote.`
    : `La reservation pour ${reservation.titre} a ete annulee par le voyageur.`;

  await notificationsService.insertNotification(null, recipientId, 'annulation', contenu, {
    reservationId: reservation.id,
    logementId: reservation.id_logement,
  });

  const emailJobs = [];
  queueUserMail(emailJobs, { email: recipientEmail }, `Annulation de reservation - ${reservation.titre}`, contenu);
  await queueReservationEmails(emailJobs);
  return updated;
};

const updateStatus = async ({ currentUser, reservationId, status: rawStatus }) => {
  const status = validateReservationStatus(rawStatus);
  const reservation = await reservationsRepository.findReservationForStatus(reservationId);
  if (!reservation) throw notFound('Reservation introuvable.');
  if (String(reservation.id_hote) !== String(currentUser.id) && currentUser.role !== 'admin') {
    throw forbidden('Acces refuse.');
  }

  const contenu =
    status === 'confirmee'
      ? `Votre reservation pour ${reservation.titre} a ete confirmee.`
      : status === 'refusee'
        ? `Votre reservation pour ${reservation.titre} a ete refusee.`
        : `Votre reservation pour ${reservation.titre} est marquee comme terminee.`;

  const updated = await reservationsRepository.updateStatus({
    reservation,
    status,
    notification: {
      userId: reservation.id_voyageur,
      type: 'reservation',
      contenu,
      meta: { reservationId: reservation.id, logementId: reservation.logement_id },
    },
  });

  const emailJobs = [];
  queueUserMail(
    emailJobs,
    { email: reservation.voyageur_email },
    status === 'confirmee'
      ? `Reservation confirmee - ${reservation.titre}`
      : status === 'refusee'
        ? `Reservation refusee - ${reservation.titre}`
        : `Sejour termine - ${reservation.titre}`,
    contenu
  );
  await queueReservationEmails(emailJobs);
  return updated;
};

module.exports = {
  cancel,
  create,
  listByTraveler,
  listHostMine,
  listMine,
  updateStatus,
};
