const avisRepository = require('../repositories/avis.repository');
const { validateCreateReviewPayload } = require('../validators/avis.validator');
const { conflict, forbidden, notFound } = require('../utils/httpError');

const listByListing = (listingId) => avisRepository.listByListing(listingId);

const create = async ({ userId, payload }) => {
  const data = validateCreateReviewPayload(payload);
  const reservation = await avisRepository.findReservationForReview(data.id_reservation);
  if (!reservation) {
    throw notFound('Reservation introuvable.');
  }
  if (String(reservation.id_voyageur) !== String(userId)) {
    throw forbidden('Seul le voyageur concerne peut laisser un avis.');
  }
  if (reservation.statut !== 'terminee') {
    throw conflict('Un avis peut etre laisse uniquement apres un sejour termine.');
  }

  try {
    return await avisRepository.create({
      voyageurId: userId,
      reservation,
      ...data,
    });
  } catch (error) {
    if (avisRepository.isUniqueViolation(error)) {
      throw conflict('Un avis existe deja pour cette reservation.');
    }
    throw error;
  }
};

const updateVisibility = async ({ reviewId, visible }) => {
  const review = await avisRepository.updateVisibility({ reviewId, visible: Boolean(visible) });
  if (!review) {
    throw notFound('Avis introuvable.');
  }
  return review;
};

module.exports = {
  create,
  listByListing,
  updateVisibility,
};
