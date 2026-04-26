const reservationsService = require('../services/reservations.service');
const { asyncController } = require('./controllerUtils');

const mine = asyncController(async (req, res) => {
  res.json(await reservationsService.listMine(req.user.id));
});

const traveler = asyncController(async (req, res) => {
  res.json(await reservationsService.listByTraveler({ currentUser: req.user, travelerId: req.params.id }));
});

const hostMine = asyncController(async (req, res) => {
  res.json(await reservationsService.listHostMine(req.user.id));
});

const create = asyncController(async (req, res) => {
  res.status(201).json(await reservationsService.create({ currentUser: req.user, payload: req.body }));
});

const cancel = asyncController(async (req, res) => {
  res.json(await reservationsService.cancel({
    currentUser: req.user,
    reservationId: req.params.id,
    reason: req.body.motif_annulation,
  }));
});

const updateStatus = asyncController(async (req, res) => {
  res.json(await reservationsService.updateStatus({
    currentUser: req.user,
    reservationId: req.params.id,
    status: req.body.statut,
  }));
});

module.exports = {
  cancel,
  create,
  hostMine,
  mine,
  traveler,
  updateStatus,
};
