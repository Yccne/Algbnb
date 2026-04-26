const express = require('express');
const authController = require('../controllers/auth.controller');
const { verifierToken } = require('../middlewares/ann');

const router = express.Router();

router.post('/inscription', authController.register);
router.post('/register', authController.register);
router.post('/connexion', authController.login);
router.post('/login', authController.login);
router.post('/google', authController.google);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', verifierToken, authController.me);
router.get('/providers', authController.providers);

module.exports = router;
