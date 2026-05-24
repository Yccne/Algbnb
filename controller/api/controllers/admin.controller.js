const adminService = require('../../../model/api/services/admin.service');
const { asyncController } = require('./controllerUtils');

const stats = asyncController(async (req, res) => {
  res.json(await adminService.getStats());
});

const users = asyncController(async (req, res) => {
  res.json(await adminService.listUsers(req.query));
});

const updateUserStatus = asyncController(async (req, res) => {
  res.json(await adminService.updateUserStatus({
    currentUser: req.user,
    userId: req.params.id,
    statut_compte: req.body.statut_compte,
    note: req.body.note,
  }));
});

const updateUserVerification = asyncController(async (req, res) => {
  res.json(await adminService.updateUserVerification({
    currentUser: req.user,
    userId: req.params.id,
    est_verifie: req.body.est_verifie,
    note: req.body.note,
  }));
});

const startImpersonation = asyncController(async (req, res) => {
  res.json(await adminService.startImpersonation({
    currentUser: req.user,
    userId: req.params.id,
  }));
});

const endImpersonation = asyncController(async (req, res) => {
  res.json(await adminService.endImpersonation({
    currentUser: req.user,
    userId: req.body.userId,
  }));
});

const listings = asyncController(async (req, res) => {
  res.json(await adminService.listListings(req.query));
});

const updateListingValidation = asyncController(async (req, res) => {
  res.json(await adminService.updateListingValidation({
    currentUser: req.user,
    listingId: req.params.id,
    validation_statut: req.body.validation_statut,
    note: req.body.note,
  }));
});

const updateListingPublication = asyncController(async (req, res) => {
  res.json(await adminService.updateListingPublication({
    currentUser: req.user,
    listingId: req.params.id,
    est_actif: req.body.est_actif,
    note: req.body.note,
  }));
});

const reservations = asyncController(async (req, res) => {
  res.json(await adminService.listReservations(req.query));
});

const updateReservationStatus = asyncController(async (req, res) => {
  res.json(await adminService.updateReservationStatus({
    currentUser: req.user,
    reservationId: req.params.id,
    statut: req.body.statut,
    motif_annulation: req.body.motif_annulation,
    note: req.body.note,
  }));
});

const conversations = asyncController(async (req, res) => {
  res.json(await adminService.listConversations(req.query));
});

const conversationMessages = asyncController(async (req, res) => {
  res.json(await adminService.listConversationMessages(req.params.id));
});

const updateMessageVisibility = asyncController(async (req, res) => {
  res.json(await adminService.updateMessageVisibility({
    currentUser: req.user,
    messageId: req.params.id,
    est_visible: req.body.est_visible,
    note: req.body.note,
  }));
});

const reviews = asyncController(async (req, res) => {
  res.json(await adminService.listReviews(req.query));
});

const updateReviewVisibility = asyncController(async (req, res) => {
  res.json(await adminService.updateReviewVisibility({
    currentUser: req.user,
    reviewId: req.params.id,
    est_visible: req.body.est_visible,
    note: req.body.note,
  }));
});

const disputes = asyncController(async (req, res) => {
  res.json(await adminService.listDisputes(req.query));
});

const exchanges = asyncController(async (req, res) => {
  res.json(await adminService.listExchanges(req.query));
});

const createDispute = asyncController(async (req, res) => {
  res.status(201).json(await adminService.createDispute({ currentUser: req.user, payload: req.body }));
});

const updateDispute = asyncController(async (req, res) => {
  res.json(await adminService.updateDispute({
    currentUser: req.user,
    disputeId: req.params.id,
    payload: req.body,
  }));
});

const actions = asyncController(async (req, res) => {
  res.json(await adminService.listActions(req.query));
});

module.exports = {
  actions,
  conversationMessages,
  conversations,
  createDispute,
  disputes,
  exchanges,
  listings,
  reservations,
  reviews,
  stats,
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
  users,
};
