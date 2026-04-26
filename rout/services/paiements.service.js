const paiementsRepository = require('../repositories/paiements.repository');
const reservationsRepository = require('../repositories/reservations.repository');
const { notFound, badRequest, forbidden } = require('../utils/httpError');

const payerReservation = async ({ currentUser, reservationId, payload }) => {
  const { numero_carte, nom_porteur, date_expiration, cvv } = payload || {};

  if (!numero_carte || !/^\d{16}$/.test(numero_carte.replace(/\s/g, '')))
    throw badRequest('Numéro de carte invalide. Saisissez 16 chiffres.');
  if (!nom_porteur || nom_porteur.trim().length < 2)
    throw badRequest('Nom du porteur manquant.');
  if (!date_expiration || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(date_expiration))
    throw badRequest("Date d'expiration invalide (format MM/AA).");
  if (!cvv || !/^\d{3}$/.test(cvv))
    throw badRequest('CVV invalide. Saisissez 3 chiffres.');

  const [mois, annee] = date_expiration.split('/').map(Number);
  const now = new Date();
  if (new Date(2000 + annee, mois - 1) < new Date(now.getFullYear(), now.getMonth()))
    throw badRequest('Carte expirée.');

  const rows = await reservationsRepository.findReservationForStatus(reservationId);
  if (!rows) throw notFound('Réservation introuvable.');

  if (String(rows.id_voyageur) !== String(currentUser.id) && currentUser.role !== 'admin')
    throw forbidden('Vous ne pouvez pas payer cette réservation.');

  if (!['en_attente', 'confirmee'].includes(rows.statut))
    throw badRequest('Cette réservation ne peut pas être payée dans son état actuel.');

  const paiement = await paiementsRepository.createPaiement({
    reservationId,
    montant: rows.total || rows.montant_total,
    devise: 'DZD',
    numeroCarte: numero_carte.replace(/\s/g, '').slice(-4),
    nomPorteur: nom_porteur.trim(),
  });

  return {
    succes: true,
    message: 'Paiement Dahabiya accepté (simulation sandbox).',
    reference: paiement.reference_transaction,
    montant: paiement.montant,
    devise: paiement.devise,
    date_paiement: paiement.date_paiement,
    carte_fin: numero_carte.replace(/\s/g, '').slice(-4),
  };
};

const getPaiement = async ({ currentUser, reservationId }) => {
  const reservation = await reservationsRepository.findReservationForStatus(reservationId);
  if (!reservation) throw notFound('Réservation introuvable.');
  if (
    String(reservation.id_voyageur) !== String(currentUser.id) &&
    String(reservation.id_hote) !== String(currentUser.id) &&
    currentUser.role !== 'admin'
  ) throw forbidden('Accès refusé.');

  const paiement = await paiementsRepository.findByReservation(reservationId);
  if (!paiement) throw notFound('Aucun paiement trouvé pour cette réservation.');
  return paiement;
};

module.exports = { payerReservation, getPaiement };