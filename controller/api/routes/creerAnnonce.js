const express = require('express');
const annoncesController = require('../controllers/annonces.controller');
const { verifierToken, estHote } = require('../middlewares/ann');
const { logementUpload } = require('../middlewares/upload');
const { validerAnnonce } = require('../middlewares/validerAnnonce');

const router = express.Router();

router.post('/', verifierToken, estHote, logementUpload.array('photos', 10), validerAnnonce, annoncesController.create);
router.get('/mes-annonces', verifierToken, estHote, annoncesController.mine);
router.get('/:id', verifierToken, estHote, annoncesController.detailMine);
router.patch('/:id', verifierToken, estHote, logementUpload.array('photos', 10), annoncesController.update);
router.patch('/:id/statut', verifierToken, estHote, annoncesController.updateStatus);
router.put('/:id/disponibilites', verifierToken, estHote, annoncesController.replaceAvailability);
router.delete('/:id', verifierToken, estHote, annoncesController.remove);

module.exports = router;
