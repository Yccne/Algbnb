const { badRequest } = require('../utils/httpError');

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const validateCreateReservationPayload = (payload) => {
  const logementId = payload.id_logement || payload.logementId;
  const startDate = payload.date_arrivee || payload.dateArrivee;
  const endDate = payload.date_depart || payload.dateDepart;
  const guestCount = Number(payload.nb_voyageurs || payload.voyageurs || 1);

  if (!logementId || !startDate || !endDate) {
    throw badRequest('Logement, dates et voyageurs sont requis.');
  }
  if (!Number.isInteger(Number(logementId)) || Number(logementId) <= 0) {
    throw badRequest('Logement invalide.');
  }
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
    throw badRequest('Les dates doivent etre au format YYYY-MM-DD.');
  }
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    throw badRequest('La date de depart doit etre apres la date d arrivee.');
  }
  if (!Number.isInteger(guestCount) || guestCount <= 0) {
    throw badRequest('Le nombre de voyageurs est invalide.');
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
