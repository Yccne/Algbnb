const healthService = require('../services/health.service');
const { asyncController } = require('./controllerUtils');

const health = asyncController(async (req, res) => {
  res.json(await healthService.getHealth());
});

module.exports = {
  health,
};
