const echangesRepository = require('../repositories/echanges.repository');
const messagesRepository = require('../repositories/messages.repository');
const notificationsService = require('./notifications.service');
const {
  asPositiveId,
  validateCancelPayload,
  validateCreatePayload,
  validateFinalDecision,
  validatePreferencePayload,
  validateReceiverResponse,
  validateRequesterProposal,
} = require('../validators/echanges.validator');
const { badRequest, conflict, forbidden, notFound } = require('../utils/httpError');

const strictHostOnly = (currentUser) => {
  if (currentUser?.role !== 'hote') {
    throw forbidden('Seuls les hotes peuvent utiliser les echanges de logements.');
  }
};

const ensureExchangeMember = (exchange, userId) => {
  const isRequester = String(exchange.id_hote_demandeur) === String(userId);
  const isReceiver = String(exchange.id_hote_receveur) === String(userId);
  if (!isRequester && !isReceiver) {
    throw forbidden('Acces refuse a cet echange.');
  }
  return { isRequester, isReceiver };
};

const fullName = (...parts) => parts.filter(Boolean).join(' ') || 'Un hote';

const notify = (userId, contenu, meta) =>
  notificationsService.insertNotification(null, userId, 'echange', contenu, meta);

const getDetailedExchange = (exchangeId) => echangesRepository.findById(exchangeId);

const listMine = async (currentUser) => {
  strictHostOnly(currentUser);
  return echangesRepository.listByHost(currentUser.id);
};

const listOpenListings = async (currentUser) => {
  strictHostOnly(currentUser);
  return echangesRepository.listOpenListings(currentUser.id);
};

const updatePreference = async ({ currentUser, listingId, payload }) => {
  strictHostOnly(currentUser);
  const id = asPositiveId(listingId, 'Logement');
  const listing = await echangesRepository.findListingForExchange(id);
  if (!listing) throw notFound('Logement introuvable.');
  if (String(listing.id_hote) !== String(currentUser.id)) {
    throw forbidden('Vous ne pouvez modifier que vos propres logements.');
  }

  const preference = validatePreferencePayload(payload);
  return echangesRepository.setPreference({
    listingId: id,
    isOpen: preference.isOpen,
    message: preference.message,
  });
};

const create = async ({ currentUser, payload }) => {
  strictHostOnly(currentUser);
  const data = validateCreatePayload(payload);

  if (data.requesterListingId === data.receiverListingId) {
    throw badRequest('Choisis deux logements differents.');
  }

  const [requesterListing, receiverListing] = await Promise.all([
    echangesRepository.findListingForExchange(data.requesterListingId),
    echangesRepository.findListingForExchange(data.receiverListingId),
  ]);

  if (!requesterListing || !receiverListing) throw notFound('Logement introuvable.');
  if (String(requesterListing.id_hote) !== String(currentUser.id)) {
    throw forbidden('Le logement propose doit vous appartenir.');
  }
  if (String(receiverListing.id_hote) === String(currentUser.id)) {
    throw badRequest('Un echange doit se faire avec un autre hote.');
  }
  if (receiverListing.hote_role !== 'hote') {
    throw badRequest('Le logement cible doit appartenir a un hote.');
  }
  if (!receiverListing.echange_ouvert || !receiverListing.est_actif || receiverListing.validation_statut !== 'valide') {
    throw badRequest('Ce logement n est pas ouvert a l echange.');
  }

  const existing = await echangesRepository.findActiveBetween(data);
  if (existing) {
    throw conflict('Une demande d echange active existe deja entre ces logements.');
  }

  const [user1, user2] = messagesRepository.normalizeConversationUsers(
    requesterListing.id_hote,
    receiverListing.id_hote
  );
  const existingConversation = await messagesRepository.findConversationByUsers({ user1, user2 });
  const conversation = existingConversation || (await messagesRepository.createConversation({ user1, user2 }));
  const exchange = await echangesRepository.createExchange({
    requesterListing,
    receiverListing,
    conversationId: conversation.id,
    actorId: currentUser.id,
  });

  await messagesRepository.createMessage({
    conversationId: conversation.id,
    senderId: currentUser.id,
    content:
      data.message ||
      `Bonjour, je suis ouvert a un echange entre "${requesterListing.titre}" et "${receiverListing.titre}".`,
    photoUrl: null,
  });

  await notify(
    receiverListing.id_hote,
    `${fullName(currentUser.prenom, currentUser.nom)} propose un echange pour ${receiverListing.titre}.`,
    { echangeId: exchange.id, conversationId: conversation.id }
  );

  return getDetailedExchange(exchange.id);
};

const proposeRequesterDates = async ({ currentUser, exchangeId, payload }) => {
  strictHostOnly(currentUser);
  const exchange = await echangesRepository.findById(asPositiveId(exchangeId, 'Echange'));
  if (!exchange) throw notFound('Echange introuvable.');
  const membership = ensureExchangeMember(exchange, currentUser.id);
  if (!membership.isRequester) throw forbidden('Seul l hote demandeur peut proposer ces dates.');
  if (!['discussion', 'proposee', 'contre_proposee'].includes(exchange.statut)) {
    throw badRequest('Cet echange ne peut plus recevoir de proposition initiale.');
  }

  const range = validateRequesterProposal(payload);
  const updated = await echangesRepository.updateRequesterProposal({
    exchangeId: exchange.id,
    startDate: range.start,
    endDate: range.end,
    actorId: currentUser.id,
  });

  await notify(exchange.id_hote_receveur, `Dates proposees pour l echange #${exchange.id}.`, {
    echangeId: exchange.id,
    conversationId: exchange.id_conversation,
  });

  return getDetailedExchange(updated.id);
};

const respondAsReceiver = async ({ currentUser, exchangeId, payload }) => {
  strictHostOnly(currentUser);
  const exchange = await echangesRepository.findById(asPositiveId(exchangeId, 'Echange'));
  if (!exchange) throw notFound('Echange introuvable.');
  const membership = ensureExchangeMember(exchange, currentUser.id);
  if (!membership.isReceiver) throw forbidden('Seul l hote receveur peut repondre a cette etape.');
  if (exchange.statut !== 'proposee') {
    throw badRequest('Cet echange n attend pas de reponse receveur.');
  }

  const data = validateReceiverResponse(payload);
  const updated = await echangesRepository.updateReceiverResponse({
    exchangeId: exchange.id,
    decision: data.decision,
    receiverStartDate: data.receiverRange?.start,
    receiverEndDate: data.receiverRange?.end,
    requesterStartDate: data.requesterRange?.start,
    requesterEndDate: data.requesterRange?.end,
    reason: data.reason,
    actorId: currentUser.id,
  });

  await notify(
    exchange.id_hote_demandeur,
    data.decision === 'accepter'
      ? `L hote a propose ses dates pour l echange #${exchange.id}.`
      : data.decision === 'contre_proposer'
        ? `L hote a envoye une contre-proposition pour l echange #${exchange.id}.`
        : `L hote a refuse l echange #${exchange.id}.`,
    { echangeId: exchange.id, conversationId: exchange.id_conversation }
  );

  return getDetailedExchange(updated.id);
};

const decideFinal = async ({ currentUser, exchangeId, payload }) => {
  strictHostOnly(currentUser);
  const exchange = await echangesRepository.findById(asPositiveId(exchangeId, 'Echange'));
  if (!exchange) throw notFound('Echange introuvable.');
  const membership = ensureExchangeMember(exchange, currentUser.id);
  if (!membership.isRequester) throw forbidden('Seul l hote demandeur peut donner l accord final.');
  if (!['contrepartie_proposee', 'contre_proposee'].includes(exchange.statut)) {
    throw badRequest('Cet echange n attend pas d accord final.');
  }

  const data = validateFinalDecision(payload);
  if (data.decision === 'refuser') {
    const refused = await echangesRepository.updateFinalRefusal({
      exchangeId: exchange.id,
      reason: data.reason,
      actorId: currentUser.id,
    });
    await notify(exchange.id_hote_receveur, `L accord final a ete refuse pour l echange #${exchange.id}.`, {
      echangeId: exchange.id,
      conversationId: exchange.id_conversation,
    });
    return getDetailedExchange(refused.id);
  }

  if (!exchange.demandeur_date_debut || !exchange.demandeur_date_fin || !exchange.receveur_date_debut || !exchange.receveur_date_fin) {
    throw badRequest('Les deux periodes doivent etre renseignees avant acceptation finale.');
  }

  const [requesterConflict, receiverConflict] = await Promise.all([
    echangesRepository.hasDateConflict({
      listingId: exchange.id_logement_receveur,
      startDate: exchange.demandeur_date_debut,
      endDate: exchange.demandeur_date_fin,
    }),
    echangesRepository.hasDateConflict({
      listingId: exchange.id_logement_demandeur,
      startDate: exchange.receveur_date_debut,
      endDate: exchange.receveur_date_fin,
    }),
  ]);

  if (requesterConflict || receiverConflict) {
    throw conflict('Une des deux periodes n est plus disponible.');
  }

  const accepted = await echangesRepository.acceptFinal({ exchange, actorId: currentUser.id });
  await Promise.all([
    notify(exchange.id_hote_demandeur, `Echange #${exchange.id} accepte et calendriers bloques.`, {
      echangeId: exchange.id,
      conversationId: exchange.id_conversation,
    }),
    notify(exchange.id_hote_receveur, `Echange #${exchange.id} accepte et calendriers bloques.`, {
      echangeId: exchange.id,
      conversationId: exchange.id_conversation,
    }),
  ]);

  return getDetailedExchange(accepted.id);
};

const cancel = async ({ currentUser, exchangeId, payload }) => {
  strictHostOnly(currentUser);
  const exchange = await echangesRepository.findById(asPositiveId(exchangeId, 'Echange'));
  if (!exchange) throw notFound('Echange introuvable.');
  const membership = ensureExchangeMember(exchange, currentUser.id);
  if (exchange.statut === 'acceptee') {
    throw badRequest('Un echange accepte ne peut pas etre annule ici.');
  }
  if (['refusee', 'annulee'].includes(exchange.statut)) {
    throw badRequest('Cet echange est deja clos.');
  }

  const data = validateCancelPayload(payload);
  const updated = await echangesRepository.cancel({
    exchangeId: exchange.id,
    reason: data.reason,
    actorId: currentUser.id,
  });
  const recipientId = membership.isRequester ? exchange.id_hote_receveur : exchange.id_hote_demandeur;
  await notify(recipientId, `L echange #${exchange.id} a ete annule.`, {
    echangeId: exchange.id,
    conversationId: exchange.id_conversation,
  });

  return getDetailedExchange(updated.id);
};

const listAllForAdmin = (filters) => echangesRepository.listAll(filters);

module.exports = {
  cancel,
  create,
  decideFinal,
  listAllForAdmin,
  listMine,
  listOpenListings,
  proposeRequesterDates,
  respondAsReceiver,
  updatePreference,
};
