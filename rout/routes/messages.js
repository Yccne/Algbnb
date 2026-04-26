const express = require('express');
const messagesController = require('../controllers/messages.controller');
const { verifierToken } = require('../middlewares/ann');
const { messageUpload } = require('../middlewares/upload');

const router = express.Router();

router.get('/conversations', verifierToken, messagesController.conversations);
router.get('/conversations/:id_utilisateur', verifierToken, messagesController.conversationsForUser);
router.get('/conversation/:id_conversation', verifierToken, messagesController.conversationMessages);
router.post('/conversations', verifierToken, messagesController.createConversation);
router.post('/', verifierToken, messagesController.createMessage);
router.post('/photo', verifierToken, messageUpload.single('photo'), messagesController.createPhotoMessage);
router.patch('/:id/lu', verifierToken, messagesController.markRead);
router.delete('/conversation/:id_conversation', verifierToken, messagesController.removeConversation);

module.exports = router;
