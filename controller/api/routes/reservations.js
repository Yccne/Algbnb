const express = require('express');
const reservationsController = require('../controllers/reservations.controller');
const { verifierToken, estHote } = require('../middlewares/ann');

const router = express.Router();

router.get('/me', verifierToken, reservationsController.mine);
router.get('/voyageur/:id', verifierToken, reservationsController.traveler);
router.get('/host/me', verifierToken, estHote, reservationsController.hostMine);
router.post('/', verifierToken, reservationsController.create);
router.patch('/:id/annuler', verifierToken, reservationsController.cancel);
router.patch('/:id/statut', verifierToken, estHote, reservationsController.updateStatus);

module.exports = router;
