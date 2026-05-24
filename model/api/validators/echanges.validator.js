const { badRequest } = require('../utils/httpError');

const allowedDecisions = ['accepter', 'refuser'];
const allowedReceiverDecisions = ['accepter', 'refuser', 'contre_proposer'];

const asPositiveId = (value, label) => {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw badRequest(`${label} invalide.`);
  }
  return id;
};

const normalizeText = (value, max = 600) => {
  const text = String(value || '').trim();
  if (!text) return null;
  return text.slice(0, max);
};

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));

const validateDateRange = ({ start, end, label }) => {
  if (!isIsoDate(start) || !isIsoDate(end)) {
    throw badRequest(`${label}: dates requises au format YYYY-MM-DD.`);
  }

  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
    throw badRequest(`${label}: la date de fin doit etre apres la date de debut.`);
  }

  return { start, end };
};

const validatePreferencePayload = (payload = {}) => ({
  isOpen: payload.est_ouvert === true || payload.est_ouvert === 'true',
  message: normalizeText(payload.message),
});

const validateCreatePayload = (payload = {}) => ({
  requesterListingId: asPositiveId(
    payload.id_logement_demandeur || payload.logementDemandeurId,
    'Logement demandeur'
  ),
  receiverListingId: asPositiveId(
    payload.id_logement_receveur || payload.logementReceveurId,
    'Logement receveur'
  ),
  message: normalizeText(payload.message),
});

const validateRequesterProposal = (payload = {}) =>
  validateDateRange({
    start: payload.demandeur_date_debut || payload.dateDebut || payload.startDate,
    end: payload.demandeur_date_fin || payload.dateFin || payload.endDate,
    label: 'Periode demandee',
  });

const validateReceiverResponse = (payload = {}) => {
  const decision = String(payload.decision || '').trim().toLowerCase();
  if (!allowedReceiverDecisions.includes(decision)) {
    throw badRequest('Decision invalide.');
  }
  const reason = normalizeText(payload.motif_refus || payload.reason, 500);
  if (decision === 'refuser' && !reason) {
    throw badRequest('Le motif du refus est obligatoire.');
  }

  return {
    decision,
    reason,
    receiverRange:
      decision === 'accepter' || decision === 'contre_proposer'
        ? validateDateRange({
            start: payload.receveur_date_debut || payload.dateDebut || payload.startDate,
            end: payload.receveur_date_fin || payload.dateFin || payload.endDate,
            label: 'Contrepartie hote',
          })
        : null,
    requesterRange:
      decision === 'contre_proposer'
        ? validateDateRange({
            start: payload.demandeur_date_debut || payload.demandeurDateDebut || payload.requesterStartDate,
            end: payload.demandeur_date_fin || payload.demandeurDateFin || payload.requesterEndDate,
            label: 'Nouvelle periode demandee',
          })
        : null,
  };
};

const validateFinalDecision = (payload = {}) => {
  const decision = String(payload.decision || '').trim().toLowerCase();
  if (!allowedDecisions.includes(decision)) {
    throw badRequest('Decision invalide.');
  }
  const reason = normalizeText(payload.motif_refus || payload.reason, 500);
  if (decision === 'refuser' && !reason) {
    throw badRequest('Le motif du refus est obligatoire.');
  }
  return {
    decision,
    reason,
  };
};

const validateCancelPayload = (payload = {}) => ({
  reason: normalizeText(payload.motif_annulation || payload.reason, 500),
});

module.exports = {
  asPositiveId,
  validateCancelPayload,
  validateCreatePayload,
  validateFinalDecision,
  validatePreferencePayload,
  validateReceiverResponse,
  validateRequesterProposal,
};
