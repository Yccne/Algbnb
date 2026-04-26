const healthRepository = require('../repositories/health.repository');

const getHealth = async () => ({
  ok: true,
  api: 'ready',
  database: await healthRepository.getDatabaseStatus(),
});

module.exports = {
  getHealth,
};
