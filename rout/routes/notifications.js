const express = require('express');
const notificationsController = require('../controllers/notifications.controller');
const { verifierToken } = require('../middlewares/ann');

const router = express.Router();

router.get('/summary', verifierToken, notificationsController.summary);
router.get('/', verifierToken, notificationsController.list);
router.patch('/read-all', verifierToken, notificationsController.readAll);
router.patch('/:id/read', verifierToken, notificationsController.readOne);

module.exports = router;
