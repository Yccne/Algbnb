const express = require('express');
const usersController = require('../controllers/users.controller');
const { verifierToken } = require('../middlewares/ann');
const { profilUpload } = require('../middlewares/upload');

const router = express.Router();

router.get('/me', verifierToken, usersController.me);
router.patch('/me', verifierToken, usersController.updateMe);
router.post('/me/photo', verifierToken, profilUpload.single('photo'), usersController.updatePhoto);
router.get('/:id/public', usersController.publicProfile);

module.exports = router;
