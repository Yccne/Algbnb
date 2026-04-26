const annoncesService = require('../services/annonces.service');
const { asyncController } = require('./controllerUtils');

const create = asyncController(async (req, res) => {
  res.status(201).json(await annoncesService.create({ userId: req.user.id, payload: req.body, files: req.files }));
});

const mine = asyncController(async (req, res) => {
  res.json(await annoncesService.listMine(req.user.id));
});

const detailMine = asyncController(async (req, res) => {
  res.json(await annoncesService.detailMine({ listingId: req.params.id, userId: req.user.id }));
});

const update = asyncController(async (req, res) => {
  res.json(await annoncesService.update({
    listingId: req.params.id,
    userId: req.user.id,
    payload: req.body,
    files: req.files || [],
  }));
});

const updateStatus = asyncController(async (req, res) => {
  res.json(await annoncesService.updateStatus({
    listingId: req.params.id,
    userId: req.user.id,
    active: req.body.est_actif,
  }));
});

const replaceAvailability = asyncController(async (req, res) => {
  res.json(await annoncesService.replaceAvailability({
    listingId: req.params.id,
    userId: req.user.id,
    disponibilites: req.body.disponibilites,
  }));
});

const remove = asyncController(async (req, res) => {
  res.json(await annoncesService.remove({ listingId: req.params.id, userId: req.user.id }));
});

module.exports = {
  create,
  detailMine,
  mine,
  remove,
  replaceAvailability,
  update,
  updateStatus,
};
