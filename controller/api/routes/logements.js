const express = require('express');
const logementsController = require('../controllers/logements.controller');

const router = express.Router();

router.get('/', logementsController.list);
router.get('/map', logementsController.map);
router.get('/location-search', logementsController.locationSearch);
router.get('/reverse-location', logementsController.reverseLocation);
router.get('/:id/disponibilites', logementsController.availability);
router.get('/:id', logementsController.detail);

module.exports = router;
