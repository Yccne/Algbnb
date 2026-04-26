const messagesRepository = require('../repositories/messages.repository');
const notificationsService = require('./notifications.service');
const { queueUserMail } = require('../utils/notifications');
const {
  validateCreateConversationPayload,
  validateMessagePayload,
  validatePhotoMessagePayload,
} = require('../validators/messages.validator');
const { forbidden, notFound } = require('../utils/httpError');

const getRecipientId = (conversation, currentUserId) =>
  String(conversation.id_utilisateur1) === String(currentUserId)
    ? conversation.id_utilisateur2
    : conversation.id_utilisateur1;

const ensureConversationMember = async ({ conversationId, userId }) => {
  const conversation = await messagesRepository.findConversationMember({ conversationId, userId });
  if (!conversation) {
    throw forbidden('Conversation introuvable ou acces refuse.');
  }
  return conversation;
};

const sendMessageNotification = async ({ conversation, currentUser, currentUserId, messageId, isPhotoOnly }) => {
  const recipientId = getRecipientId(conversation, currentUserId);
  const recipient = await messagesRepository.findUserById(recipientId);
  if (!recipient) return;

  const senderName = [currentUser.prenom, currentUser.nom].filter(Boolean).join(' ') || 'Un utilisateur';
  const contenu = isPhotoOnly
    ? `${senderName} vous a envoye une photo.`
    : `${senderName} vous a envoye un nouveau message.`;

  await notificationsService.insertNotification(null, recipient.id, 'message', contenu, {
    conversationId: conversation.id,
    fromUserId: currentUserId,
    messageId,
  });

  const emailJobs = [];
  queueUserMail(
    emailJobs,
    recipient,
    `Nouveau message de ${senderName}`,
    isPhotoOnly
      ? `${senderName} vous a envoye une photo dans votre messagerie.`
      : `${senderName} vous a envoye un nouveau message dans votre messagerie.`
  );
  await Promise.allSettled(emailJobs);
};

const listConversations = (userId) => messagesRepository.listConversations(userId);

const listConversationsForUser = ({ currentUser, userId }) => {
  if (String(currentUser.id) !== String(userId) && currentUser.role !== 'admin') {
    throw forbidden('Acces refuse.');
  }
  return messagesRepository.listConversations(Number(userId));
};

const listMessages = async ({ conversationId, userId }) => {
  await ensureConversationMember({ conversationId, userId });
  await messagesRepository.markConversationRead({ conversationId, userId });
  return messagesRepository.listMessages(conversationId);
};

const createConversation = async ({ currentUserId, payload }) => {
  const interlocuteurId = validateCreateConversationPayload(payload);
  const [user1, user2] = messagesRepository.normalizeConversationUsers(currentUserId, interlocuteurId);
  const existing = await messagesRepository.findConversationByUsers({ user1, user2 });
  if (existing) return { conversation: existing, created: false };

  return {
    conversation: await messagesRepository.createConversation({ user1, user2 }),
    created: true,
  };
};

const createMessage = async ({ currentUser, payload }) => {
  const data = validateMessagePayload(payload);
  const conversation = await ensureConversationMember({ conversationId: data.conversationId, userId: currentUser.id });
  const message = await messagesRepository.createMessage({
    conversationId: data.conversationId,
    senderId: currentUser.id,
    content: data.content,
    photoUrl: data.photoUrl,
  });
  await sendMessageNotification({
    conversation,
    currentUser,
    currentUserId: currentUser.id,
    messageId: message.id,
    isPhotoOnly: !data.content,
  });
  return message;
};

const createPhotoMessage = async ({ currentUser, payload, file }) => {
  const data = validatePhotoMessagePayload(payload, file);
  const conversation = await ensureConversationMember({ conversationId: data.conversationId, userId: currentUser.id });
  const message = await messagesRepository.createMessage({
    conversationId: data.conversationId,
    senderId: currentUser.id,
    content: data.content,
    photoUrl: data.photoUrl,
  });
  await sendMessageNotification({
    conversation,
    currentUser,
    currentUserId: currentUser.id,
    messageId: message.id,
    isPhotoOnly: !String(data.content || '').trim(),
  });
  return message;
};

const markRead = async ({ messageId, userId }) => {
  const message = await messagesRepository.markMessageRead({ messageId, userId });
  if (!message) throw notFound('Message introuvable.');
  return message;
};

const removeConversation = async ({ conversationId, userId }) => {
  await ensureConversationMember({ conversationId, userId });
  await messagesRepository.deleteConversation(conversationId);
  return { message: 'Conversation supprimee.' };
};

module.exports = {
  createConversation,
  createMessage,
  createPhotoMessage,
  listConversations,
  listConversationsForUser,
  listMessages,
  markRead,
  removeConversation,
};
