const express = require('express');
const echangesController = require('../controllers/echanges.controller');
const { verifierToken, estHote } = require('../middlewares/ann');

const router = express.Router();

router.get('/me', verifierToken, estHote, echangesController.mine);
router.get('/logements-ouverts', verifierToken, estHote, echangesController.openListings);
router.patch('/logements/:id/preference', verifierToken, estHote, echangesController.updatePreference);
router.post('/', verifierToken, estHote, echangesController.create);
router.patch('/:id/proposition-demandeur', verifierToken, estHote, echangesController.requesterProposal);
router.patch('/:id/reponse-receveur', verifierToken, estHote, echangesController.receiverResponse);
router.patch('/:id/decision-finale', verifierToken, estHote, echangesController.finalDecision);
router.patch('/:id/annuler', verifierToken, estHote, echangesController.cancel);

module.exports = router;
