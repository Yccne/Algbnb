const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { verifierToken, estHote } = require('../middlewares/ann');

const router = express.Router();

router.get('/host/me', verifierToken, estHote, dashboardController.hostMe);
router.get('/hote/:id', verifierToken, dashboardController.hostById);

module.exports = router;
