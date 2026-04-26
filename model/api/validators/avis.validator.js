const { badRequest } = require('../utils/httpError');

const validateCreateReviewPayload = ({ id_reservation, note_logement, note_hote, commentaire }) => {
  if (!id_reservation || !note_logement || !note_hote) {
    throw badRequest('Reservation et notes sont requises.');
  }

  return {
    id_reservation,
    note_logement: Number(note_logement),
    note_hote: Number(note_hote),
    commentaire: commentaire || null,
  };
};

module.exports = {
  validateCreateReviewPayload,
};
