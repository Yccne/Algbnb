const express = require('express');
const paiementsController = require('../controllers/paiements.controller');
const { verifierToken } = require('../middlewares/ann');

const router = express.Router();

router.post('/reservation/:id', verifierToken, paiementsController.payer);
router.get('/reservation/:id', verifierToken, paiementsController.getOne);

module.exports = router;