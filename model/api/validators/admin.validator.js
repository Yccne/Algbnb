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

const validateDisputePayload = ({ id_reservation, id_ouverture, sujet, description }) => {
  if (!id_ouverture || !sujet || !description) {
    throw badRequest('Auteur, sujet et description sont requis.');
  }
  return {
    id_reservation: id_reservation || null,
    id_ouverture,
    sujet,
    description,
  };
};

module.exports = {
  validateAccountStatus,
  validateDisputePayload,
  validateListingValidationStatus,
};
