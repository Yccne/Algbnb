const echangesService = require('../../../model/api/services/echanges.service');
const { asyncController } = require('./controllerUtils');

const mine = asyncController(async (req, res) => {
  res.json(await echangesService.listMine(req.user));
});

const openListings = asyncController(async (req, res) => {
  res.json(await echangesService.listOpenListings(req.user));
});

const updatePreference = asyncController(async (req, res) => {
  res.json(await echangesService.updatePreference({
    currentUser: req.user,
    listingId: req.params.id,
    payload: req.body,
  }));
});

const create = asyncController(async (req, res) => {
  res.status(201).json(await echangesService.create({ currentUser: req.user, payload: req.body }));
});

const requesterProposal = asyncController(async (req, res) => {
  res.json(await echangesService.proposeRequesterDates({
    currentUser: req.user,
    exchangeId: req.params.id,
    payload: req.body,
  }));
});

const receiverResponse = asyncController(async (req, res) => {
  res.json(await echangesService.respondAsReceiver({
    currentUser: req.user,
    exchangeId: req.params.id,
    payload: req.body,
  }));
});

const finalDecision = asyncController(async (req, res) => {
  res.json(await echangesService.decideFinal({
    currentUser: req.user,
    exchangeId: req.params.id,
    payload: req.body,
  }));
});

const cancel = asyncController(async (req, res) => {
  res.json(await echangesService.cancel({
    currentUser: req.user,
    exchangeId: req.params.id,
    payload: req.body,
  }));
});

module.exports = {
  cancel,
  create,
  finalDecision,
  mine,
  openListings,
  receiverResponse,
  requesterProposal,
  updatePreference,
};
