const express = require('express');
const adminController = require('../controllers/admin.controller');
const { verifierToken, estAdmin } = require('../middlewares/ann');

const router = express.Router();

router.use(verifierToken, estAdmin);
router.get('/stats', adminController.stats);
router.get('/users', adminController.users);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.get('/annonces', adminController.listings);
router.patch('/annonces/:id/validation', adminController.updateListingValidation);
router.get('/litiges', adminController.disputes);
router.post('/litiges', adminController.createDispute);

module.exports = router;
