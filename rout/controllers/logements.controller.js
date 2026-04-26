const logementsService = require('../services/logements.service');
const { asyncController } = require('./controllerUtils');

const list = asyncController(async (req, res) => {
  res.json(await logementsService.list({ query: req.query, originalUrl: req.originalUrl }));
});

const map = asyncController(async (req, res) => {
  res.json(await logementsService.listMap({ query: req.query, originalUrl: req.originalUrl }));
});

const locationSearch = asyncController(async (req, res) => {
  res.json(await logementsService.searchLocations(req.query.q));
});

const reverseLocation = asyncController(async (req, res) => {
  res.json(await logementsService.reverse({
    latitude: req.query.lat ?? req.query.latitude,
    longitude: req.query.lon ?? req.query.lng ?? req.query.longitude,
  }));
});

const availability = asyncController(async (req, res) => {
  res.json(await logementsService.availability(req.params.id));
});

const detail = asyncController(async (req, res) => {
  res.json(await logementsService.detail(req.params.id));
});

module.exports = {
  availability,
  detail,
  list,
  locationSearch,
  map,
  reverseLocation,
};
