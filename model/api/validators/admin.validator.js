const { badRequest } = require('../utils/httpError');

const validateAccountStatus = (status) => {
  if (!['actif', 'suspendu', 'bloque'].includes(status)) {
    throw badRequest('Statut invalide.');
  }
  return status;
};

const validateListingValidationStatus = (status) => {
  if (!['en_attente', 'valide', 'refuse'].includes(status)) {
    throw badRequest('Statut de validation invalide.');
  }
  return status;
};

const validateReservationStatus = (status) => {
  if (!['en_attente', 'confirmee', 'refusee', 'annulee_voyageur', 'annulee_hote', 'annulee_admin', 'terminee'].includes(status)) {
    throw badRequest('Statut de reservation invalide.');
  }
  return status;
};

const validateDisputeStatus = (status) => {
  if (!['ouvert', 'en_cours', 'resolu', 'ferme'].includes(status)) {
    throw badRequest('Statut de litige invalide.');
  }
  return status;
};

const validateDisputePriority = (priority) => {
  if (!['basse', 'normale', 'haute', 'urgente'].includes(priority)) {
    throw badRequest('Priorite de litige invalide.');
  }
  return priority;
};

const validateBoolean = (value, label) => {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw badRequest(`${label} invalide.`);
};

const validateActionNote = (note) => {
  const normalized = String(note || '').trim();
  return normalized || 'Action admin.';
};

const validateDisputePayload = ({ id_reservation, id_ouverture, id_conversation, sujet, description, priorite, id_assigne }) => {
  if (!id_ouverture || !sujet || !description) {
    throw badRequest('Auteur, sujet et description sont requis.');
  }
  return {
    id_reservation: id_reservation || null,
    id_ouverture,
    id_assigne: id_assigne || null,
    id_conversation: id_conversation || null,
    sujet,
    description,
    priorite: priorite ? validateDisputePriority(priorite) : 'normale',
  };
};

module.exports = {
  validateAccountStatus,
  validateActionNote,
  validateBoolean,
  validateDisputePayload,
  validateDisputePriority,
  validateDisputeStatus,
  validateListingValidationStatus,
  validateReservationStatus,
};
