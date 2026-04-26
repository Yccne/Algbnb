const favorisService = require('../services/favoris.service');
const { asyncController } = require('./controllerUtils');

const list = asyncController(async (req, res) => {
  res.json(await favorisService.list(req.user.id));
});

const add = asyncController(async (req, res) => {
  res.status(201).json(await favorisService.add({ userId: req.user.id, listingId: req.params.logementId }));
});

const remove = asyncController(async (req, res) => {
  res.json(await favorisService.remove({ userId: req.user.id, listingId: req.params.logementId }));
});

module.exports = {
  add,
  list,
  remove,
};
