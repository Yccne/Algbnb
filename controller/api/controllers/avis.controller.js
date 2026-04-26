const avisService = require('../../../model/api/services/avis.service');
const { asyncController } = require('./controllerUtils');

const listByListing = asyncController(async (req, res) => {
  res.json(await avisService.listByListing(req.params.id));
});

const create = asyncController(async (req, res) => {
  res.status(201).json(await avisService.create({ userId: req.user.id, payload: req.body }));
});

const updateVisibility = asyncController(async (req, res) => {
  res.json(await avisService.updateVisibility({ reviewId: req.params.id, visible: req.body.est_visible }));
});

module.exports = {
  create,
  listByListing,
  updateVisibility,
};
