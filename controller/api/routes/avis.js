const express = require('express');
const avisController = require('../controllers/avis.controller');
const { verifierToken, estAdmin } = require('../middlewares/ann');

const router = express.Router();

router.get('/logement/:id', avisController.listByListing);
router.post('/', verifierToken, avisController.create);
router.patch('/:id/visibility', verifierToken, estAdmin, avisController.updateVisibility);

module.exports = router;
