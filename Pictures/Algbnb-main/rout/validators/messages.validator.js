const { badRequest } = require('../utils/httpError');

const validateCreateConversationPayload = (payload) => {
  const interlocuteurId = payload.interlocuteur_id || payload.id_utilisateur2;
  if (!interlocuteurId) {
    throw badRequest('interlocuteur_id est requis.');
  }
  return interlocuteurId;
};

const validateMessagePayload = ({ id_conversation, contenu, photo_url }) => {
  const trimmedContent = String(contenu || '').trim();
  const trimmedPhotoUrl = String(photo_url || '').trim();
  if (!id_conversation || (!trimmedContent && !trimmedPhotoUrl)) {
    throw badRequest('Conversation et contenu ou photo sont requis.');
  }
  return {
    conversationId: id_conversation,
    content: trimmedContent || null,
    photoUrl: trimmedPhotoUrl || null,
  };
};

const validatePhotoMessagePayload = ({ id_conversation, contenu }, file) => {
  if (!id_conversation || !file) {
    throw badRequest('Conversation et photo sont requises.');
  }
  return {
    conversationId: id_conversation,
    content: contenu || null,
    photoUrl: `/uploads/messages/${file.filename}`,
  };
};

module.exports = {
  validateCreateConversationPayload,
  validateMessagePayload,
  validatePhotoMessagePayload,
};
