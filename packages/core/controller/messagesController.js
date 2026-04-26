import { del, get, patch, post } from '../apiClient.js';
import { mapConversation, mapMessage } from './_shared.js';

export const getConversations = async () => {
  const data = await get('/messages/conversations');
  return data.map(mapConversation);
};

export const getConversationMessages = async (conversationId) => {
  const data = await get(`/messages/conversation/${conversationId}`);
  return data.map(mapMessage);
};

export const createConversation = async (interlocuteur_id) => post('/messages/conversations', { interlocuteur_id });

export const sendMessage = async (id_conversation, contenuOrPayload, maybePhotoUrl) => {
  const payload =
    typeof contenuOrPayload === 'object'
      ? { id_conversation, ...contenuOrPayload }
      : { id_conversation, contenu: contenuOrPayload, photo_url: maybePhotoUrl };

  const data = await post('/messages', payload);
  return mapMessage(data);
};

export const sendPhotoMessage = async (id_conversation, photo, contenu = '') => {
  const formData = new FormData();
  formData.append('id_conversation', id_conversation);
  if (contenu) {
    formData.append('contenu', contenu);
  }
  formData.append('photo', photo);

  const data = await post('/messages/photo', formData);
  return mapMessage(data);
};

export const markMessageRead = async (id) => {
  const data = await patch(`/messages/${id}/lu`, {});
  return mapMessage(data);
};

export const deleteConversation = async (id) => del(`/messages/conversation/${id}`);
