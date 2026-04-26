const dashboardService = require('../services/dashboard.service');
const { asyncController } = require('./controllerUtils');

const hostMe = asyncController(async (req, res) => {
  res.json(await dashboardService.getHostDashboard(req.user.id));
});

const hostById = asyncController(async (req, res) => {
  res.json(await dashboardService.getHostDashboardForUser({ currentUser: req.user, hostId: req.params.id }));
});

module.exports = {
  hostById,
  hostMe,
};
