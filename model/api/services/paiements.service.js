const paiementsRepository = require('../repositories/paiements.repository');
const reservationsRepository = require('../repositories/reservations.repository');
const { badRequest, forbidden, notFound } = require('../utils/httpError');

const normalizeCardNumber = (value) => String(value || '').replace(/\s/g, '');

const validateCardPayload = (payload = {}) => {
  const numeroCarte = normalizeCardNumber(payload.numero_carte);
  const nomPorteur = String(payload.nom_porteur || '').trim();
  const dateExpiration = String(payload.date_expiration || '').trim();
  const cvv = String(payload.cvv || '').trim();

  if (!/^\d{16}$/.test(numeroCarte)) {
    throw badRequest('Numero de carte invalide. Saisissez 16 chiffres.');
  }
  if (nomPorteur.length < 2) {
    throw badRequest('Nom du porteur manquant.');
  }
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(dateExpiration)) {
    throw badRequest("Date d'expiration invalide (format MM/AA).");
  }
  if (!/^\d{3}$/.test(cvv)) {
    throw badRequest('CVV invalide. Saisissez 3 chiffres.');
  }

  const [month, year] = dateExpiration.split('/').map(Number);
  const now = new Date();
  if (new Date(2000 + year, month - 1) < new Date(now.getFullYear(), now.getMonth())) {
    throw badRequest('Carte expiree.');
  }

  return { numeroCarte, nomPorteur };
};

const payerReservation = async ({ currentUser, reservationId, payload }) => {
  const { numeroCarte } = validateCardPayload(payload);
  const reservation = await reservationsRepository.findReservationForStatus(reservationId);
  if (!reservation) throw notFound('Reservation introuvable.');

  if (String(reservation.id_voyageur) !== String(currentUser.id)) {
    throw forbidden('Vous ne pouvez pas payer cette reservation.');
  }

  if (!['en_attente', 'confirmee'].includes(reservation.statut)) {
    throw badRequest('Cette reservation ne peut pas etre payee dans son etat actuel.');
  }

  const paiement = await paiementsRepository.createPaiement({
    reservationId,
    montant: reservation.total || reservation.montant_total,
    devise: 'DZD',
  });

  return {
    succes: true,
    message: 'Paiement Dahabiya accepte (simulation sandbox).',
    reference: paiement.reference_transaction,
    montant: paiement.montant,
    devise: paiement.devise,
    date_paiement: paiement.date_paiement,
    carte_fin: numeroCarte.slice(-4),
  };
};

const getPaiement = async ({ currentUser, reservationId }) => {
  const reservation = await reservationsRepository.findReservationForStatus(reservationId);
  if (!reservation) throw notFound('Reservation introuvable.');
  if (
    String(reservation.id_voyageur) !== String(currentUser.id) &&
    String(reservation.id_hote) !== String(currentUser.id) &&
    currentUser.role !== 'admin'
  ) {
    throw forbidden('Acces refuse.');
  }

  const paiement = await paiementsRepository.findByReservation(reservationId);
  if (!paiement) throw notFound('Aucun paiement trouve pour cette reservation.');
  return paiement;
};

module.exports = { payerReservation, getPaiement };
