const adminRepository = require('../repositories/admin.repository');
const {
  validateAccountStatus,
  validateDisputePayload,
  validateListingValidationStatus,
} = require('../validators/admin.validator');
const { notFound } = require('../utils/httpError');

const getStats = () => adminRepository.getStats();
const listUsers = () => adminRepository.listUsers();
const listListings = () => adminRepository.listListings();
const listDisputes = () => adminRepository.listDisputes();

const updateUserStatus = async ({ userId, statut_compte }) => {
  const status = validateAccountStatus(statut_compte);
  const user = await adminRepository.updateUserStatus({ userId, status });
  if (!user) throw notFound('Utilisateur introuvable.');
  return user;
};

const updateListingValidation = async ({ listingId, validation_statut }) => {
  const status = validateListingValidationStatus(validation_statut);
  const listing = await adminRepository.updateListingValidation({ listingId, status });
  if (!listing) throw notFound('Annonce introuvable.');
  return listing;
};

const createDispute = (payload) => adminRepository.createDispute(validateDisputePayload(payload));

module.exports = {
  createDispute,
  getStats,
  listDisputes,
  listListings,
  listUsers,
  updateListingValidation,
  updateUserStatus,
};
