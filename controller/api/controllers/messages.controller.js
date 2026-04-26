const messagesService = require('../../../model/api/services/messages.service');
const { asyncController } = require('./controllerUtils');

const conversations = asyncController(async (req, res) => {
  res.json(await messagesService.listConversations(req.user.id));
});

const conversationsForUser = asyncController(async (req, res) => {
  res.json(await messagesService.listConversationsForUser({
    currentUser: req.user,
    userId: req.params.id_utilisateur,
  }));
});

const conversationMessages = asyncController(async (req, res) => {
  res.json(await messagesService.listMessages({
    conversationId: req.params.id_conversation,
    userId: req.user.id,
  }));
});

const createConversation = asyncController(async (req, res) => {
  const result = await messagesService.createConversation({ currentUserId: req.user.id, payload: req.body });
  res.status(result.created ? 201 : 200).json(result.conversation);
});

const createMessage = asyncController(async (req, res) => {
  res.status(201).json(await messagesService.createMessage({ currentUser: req.user, payload: req.body }));
});

const createPhotoMessage = asyncController(async (req, res) => {
  res.status(201).json(await messagesService.createPhotoMessage({
    currentUser: req.user,
    payload: req.body,
    file: req.file,
  }));
});

const markRead = asyncController(async (req, res) => {
  res.json(await messagesService.markRead({ messageId: req.params.id, userId: req.user.id }));
});

const removeConversation = asyncController(async (req, res) => {
  res.json(await messagesService.removeConversation({
    conversationId: req.params.id_conversation,
    userId: req.user.id,
  }));
});

module.exports = {
  conversationMessages,
  conversations,
  conversationsForUser,
  createConversation,
  createMessage,
  createPhotoMessage,
  markRead,
  removeConversation,
};
