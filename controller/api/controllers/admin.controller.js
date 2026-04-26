const adminService = require('../../../model/api/services/admin.service');
const { asyncController } = require('./controllerUtils');

const stats = asyncController(async (req, res) => {
  res.json(await adminService.getStats());
});

const users = asyncController(async (req, res) => {
  res.json(await adminService.listUsers());
});

const updateUserStatus = asyncController(async (req, res) => {
  res.json(await adminService.updateUserStatus({ userId: req.params.id, statut_compte: req.body.statut_compte }));
});

const listings = asyncController(async (req, res) => {
  res.json(await adminService.listListings());
});

const updateListingValidation = asyncController(async (req, res) => {
  res.json(await adminService.updateListingValidation({
    listingId: req.params.id,
    validation_statut: req.body.validation_statut,
  }));
});

const disputes = asyncController(async (req, res) => {
  res.json(await adminService.listDisputes());
});

const createDispute = asyncController(async (req, res) => {
  res.status(201).json(await adminService.createDispute(req.body));
});

module.exports = {
  createDispute,
  disputes,
  listings,
  stats,
  updateListingValidation,
  updateUserStatus,
  users,
};
