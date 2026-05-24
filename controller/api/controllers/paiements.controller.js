const paiementsService = require('../../../model/api/services/paiements.service');
const { asyncController } = require('./controllerUtils');

const payer = asyncController(async (req, res) => {
  const result = await paiementsService.payerReservation({
    currentUser: req.user,
    reservationId: req.params.id,
    payload: req.body,
  });
  res.status(201).json(result);
});

const getOne = asyncController(async (req, res) => {
  const result = await paiementsService.getPaiement({
    currentUser: req.user,
    reservationId: req.params.id,
  });
  res.json(result);
});

module.exports = { payer, getOne };
