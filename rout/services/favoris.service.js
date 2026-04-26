const favorisRepository = require('../repositories/favoris.repository');
const { notFound } = require('../utils/httpError');

const list = (userId) => favorisRepository.listByUser(userId);

const add = async ({ userId, listingId }) => {
  const listing = await favorisRepository.findListing(listingId);
  if (!listing) {
    throw notFound('Logement introuvable.');
  }
  await favorisRepository.add({ userId, listingId });
  return { message: 'Favori ajoute.' };
};

const remove = async ({ userId, listingId }) => {
  await favorisRepository.remove({ userId, listingId });
  return { message: 'Favori supprime.' };
};

module.exports = {
  add,
  list,
  remove,
};
