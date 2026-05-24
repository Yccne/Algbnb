const adminRepository = require('../repositories/admin.repository');
const echangesRepository = require('../repositories/echanges.repository');
const {
  validateAccountStatus,
  validateActionNote,
  validateBoolean,
  validateDisputePayload,
  validateDisputePriority,
  validateDisputeStatus,
  validateListingValidationStatus,
  validateReservationStatus,
} = require('../validators/admin.validator');
const { conflict, forbidden, notFound } = require('../utils/httpError');
const { sanitizeUser, signToken } = require('../utils/auth');

const getStats = () => adminRepository.getStats();
const listUsers = (filters) => adminRepository.listUsers(filters);
const listListings = (filters) => adminRepository.listListings(filters);
const listReservations = (filters) => adminRepository.listReservations(filters);
const listConversations = (filters) => adminRepository.listConversations(filters);
const listConversationMessages = (conversationId) => adminRepository.listConversationMessages(conversationId);
const listReviews = (filters) => adminRepository.listReviews(filters);
const listDisputes = (filters) => adminRepository.listDisputes(filters);
const listActions = (filters) => adminRepository.listActions(filters);
const listExchanges = (filters) => echangesRepository.listAll(filters);

const startImpersonation = async ({ currentUser, userId }) => {
  const target = await adminRepository.findUserForAdmin(userId);
  if (!target) throw notFound('Utilisateur introuvable.');
  if (target.role_type === 'admin') {
    throw forbidden('Un administrateur ne peut pas impersonner un autre administrateur.');
  }
  if (target.statut_compte !== 'actif') {
    throw forbidden('Ce compte doit etre actif pour etre consulte en impersonation.');
  }

  const impersonation = {
    active: true,
    adminId: currentUser.id,
    originalAdminId: currentUser.id,
  };
  const token = signToken(target, {
    impersonatedByAdminId: currentUser.id,
    originalAdminId: currentUser.id,
  });
  const user = sanitizeUser(target, { impersonation });
  await adminRepository.logAction({
    adminId: currentUser.id,
    action: 'impersonation.start',
    targetType: 'utilisateur',
    targetId: target.id,
    before: null,
    after: { user_id: target.id, role_type: target.role_type },
    note: `Connexion admin temporaire comme ${target.email || target.id}.`,
  });
  return { token, user };
};

const endImpersonation = async ({ currentUser, userId }) => {
  const target = await adminRepository.findUserForAdmin(userId);
  await adminRepository.logAction({
    adminId: currentUser.id,
    action: 'impersonation.end',
    targetType: 'utilisateur',
    targetId: userId,
    before: target ? { user_id: target.id, role_type: target.role_type } : null,
    after: null,
    note: `Retour au compte admin apres impersonation de ${target?.email || userId}.`,
  });
  return { message: 'Retour au compte administrateur journalise.' };
};

const logMutation = async ({ currentUser, action, targetType, targetId, mutation, note }) => {
  if (!mutation) throw notFound('Ressource introuvable.');
  await adminRepository.logAction({
    adminId: currentUser.id,
    action,
    targetType,
    targetId,
    before: mutation.before,
    after: mutation.after,
    note,
  });
  return mutation.after;
};

const updateUserStatus = async ({ currentUser, userId, statut_compte, note }) => {
  const status = validateAccountStatus(statut_compte);
  const actionNote = validateActionNote(note);
  return logMutation({
    currentUser,
    action: 'user.status',
    targetType: 'utilisateur',
    targetId: userId,
    mutation: await adminRepository.updateUserStatus({ userId, status }),
    note: actionNote,
  });
};

const updateUserVerification = async ({ currentUser, userId, est_verifie, note }) => {
  const verified = validateBoolean(est_verifie, 'Verification utilisateur');
  const actionNote = validateActionNote(note);
  return logMutation({
    currentUser,
    action: 'user.verification',
    targetType: 'utilisateur',
    targetId: userId,
    mutation: await adminRepository.updateUserVerification({ userId, verified }),
    note: actionNote,
  });
};

const updateListingValidation = async ({ currentUser, listingId, validation_statut, note }) => {
  const status = validateListingValidationStatus(validation_statut);
  const actionNote = validateActionNote(note);
  return logMutation({
    currentUser,
    action: 'listing.validation',
    targetType: 'logement',
    targetId: listingId,
    mutation: await adminRepository.updateListingValidation({ listingId, status }),
    note: actionNote,
  });
};

const updateListingPublication = async ({ currentUser, listingId, est_actif, note }) => {
  const active = validateBoolean(est_actif, 'Publication annonce');
  const actionNote = validateActionNote(note);
  return logMutation({
    currentUser,
    action: 'listing.publication',
    targetType: 'logement',
    targetId: listingId,
    mutation: await adminRepository.updateListingPublication({ listingId, active }),
    note: actionNote,
  });
};

const updateReservationStatus = async ({ currentUser, reservationId, statut, motif_annulation, note }) => {
  const status = validateReservationStatus(statut);
  const actionNote = validateActionNote(note || motif_annulation);
  let mutation;
  try {
    mutation = await adminRepository.updateReservationStatus({
      reservationId,
      status,
      reason: motif_annulation || actionNote,
    });
  } catch (error) {
    if (error.code === 'RESERVATION_CONFLICT' || error.code === '23P01') {
      throw conflict(error.message || 'Ce logement n est plus disponible sur cette periode.');
    }
    throw error;
  }
  return logMutation({
    currentUser,
    action: 'reservation.status',
    targetType: 'reservation',
    targetId: reservationId,
    mutation,
    note: actionNote,
  });
};

const updateMessageVisibility = async ({ currentUser, messageId, est_visible, note }) => {
  const visible = validateBoolean(est_visible, 'Visibilite message');
  const actionNote = validateActionNote(note);
  return logMutation({
    currentUser,
    action: 'message.visibility',
    targetType: 'message',
    targetId: messageId,
    mutation: await adminRepository.updateMessageVisibility({
      messageId,
      visible,
      moderatorId: currentUser.id,
      note: actionNote,
    }),
    note: actionNote,
  });
};

const updateReviewVisibility = async ({ currentUser, reviewId, est_visible, note }) => {
  const visible = validateBoolean(est_visible, 'Visibilite avis');
  const actionNote = validateActionNote(note);
  return logMutation({
    currentUser,
    action: 'review.visibility',
    targetType: 'avis',
    targetId: reviewId,
    mutation: await adminRepository.updateReviewVisibility({ reviewId, visible }),
    note: actionNote,
  });
};

const createDispute = async ({ currentUser, payload }) => {
  const dispute = await adminRepository.createDispute(validateDisputePayload({
    ...payload,
    id_assigne: payload.id_assigne || currentUser.id,
  }));
  await adminRepository.logAction({
    adminId: currentUser.id,
    action: 'dispute.create',
    targetType: 'litige',
    targetId: dispute.id,
    before: null,
    after: dispute,
    note: validateActionNote(payload.note || 'Creation litige admin.'),
  });
  return dispute;
};

const updateDispute = async ({ currentUser, disputeId, payload }) => {
  const updatePayload = {};
  if (payload.statut !== undefined) updatePayload.statut = validateDisputeStatus(payload.statut);
  if (payload.priorite !== undefined) updatePayload.priorite = validateDisputePriority(payload.priorite);
  if (payload.id_assigne !== undefined) updatePayload.id_assigne = payload.id_assigne || null;
  if (payload.resolution_note !== undefined) updatePayload.resolution_note = String(payload.resolution_note || '').trim() || null;

  const actionNote = validateActionNote(payload.note || payload.resolution_note);
  return logMutation({
    currentUser,
    action: 'dispute.update',
    targetType: 'litige',
    targetId: disputeId,
    mutation: await adminRepository.updateDispute({ disputeId, payload: updatePayload }),
    note: actionNote,
  });
};

module.exports = {
  createDispute,
  getStats,
  listActions,
  listConversationMessages,
  listConversations,
  listDisputes,
  listExchanges,
  listListings,
  listReservations,
  listReviews,
  listUsers,
  startImpersonation,
  endImpersonation,
  updateDispute,
  updateListingPublication,
  updateListingValidation,
  updateMessageVisibility,
  updateReservationStatus,
  updateReviewVisibility,
  updateUserStatus,
  updateUserVerification,
};
