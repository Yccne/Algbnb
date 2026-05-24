const express = require('express');
const adminController = require('../controllers/admin.controller');
const { verifierToken, estAdmin } = require('../middlewares/ann');

const router = express.Router();

router.use(verifierToken, estAdmin);
router.get('/stats', adminController.stats);
router.get('/users', adminController.users);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/verification', adminController.updateUserVerification);
router.post('/users/:id/impersonation', adminController.startImpersonation);
router.post('/impersonation/end', adminController.endImpersonation);
router.get('/annonces', adminController.listings);
router.patch('/annonces/:id/validation', adminController.updateListingValidation);
router.patch('/annonces/:id/publication', adminController.updateListingPublication);
router.get('/reservations', adminController.reservations);
router.patch('/reservations/:id/status', adminController.updateReservationStatus);
router.get('/conversations', adminController.conversations);
router.get('/conversations/:id/messages', adminController.conversationMessages);
router.patch('/messages/:id/visibility', adminController.updateMessageVisibility);
router.get('/avis', adminController.reviews);
router.patch('/avis/:id/visibility', adminController.updateReviewVisibility);
router.get('/litiges', adminController.disputes);
router.get('/echanges', adminController.exchanges);
router.post('/litiges', adminController.createDispute);
router.patch('/litiges/:id', adminController.updateDispute);
router.get('/actions', adminController.actions);

module.exports = router;
