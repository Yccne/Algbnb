const express = require('express');
const favorisController = require('../controllers/favoris.controller');
const { verifierToken } = require('../middlewares/ann');

const router = express.Router();

router.get('/', verifierToken, favorisController.list);
router.post('/:logementId', verifierToken, favorisController.add);
router.delete('/:logementId', verifierToken, favorisController.remove);

module.exports = router;
