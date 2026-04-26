const { badRequest } = require('../utils/httpError');

const validateCreateReservationPayload = (payload) => {
  const logementId = payload.id_logement || payload.logementId;
  const startDate = payload.date_arrivee || payload.dateArrivee;
  const endDate = payload.date_depart || payload.dateDepart;
  const guestCount = Number(payload.nb_voyageurs || payload.voyageurs || 1);

  if (!logementId || !startDate || !endDate) {
    throw badRequest('Logement, dates et voyageurs sont requis.');
  }

  return { logementId, startDate, endDate, guestCount };
};

const validateReservationStatus = (status) => {
  if (!['confirmee', 'refusee', 'terminee'].includes(status)) {
    throw badRequest('Statut invalide.');
  }
  return status;
};

module.exports = {
  validateCreateReservationPayload,
  validateReservationStatus,
};
