const notificationsService = require('../services/notifications.service');
const { asyncController } = require('./controllerUtils');

const summary = asyncController(async (req, res) => {
  res.json(await notificationsService.getSummary(req.user.id));
});

const list = asyncController(async (req, res) => {
  res.json(await notificationsService.listNotifications(req.user.id, req.query));
});

const readAll = asyncController(async (req, res) => {
  res.json(await notificationsService.markAllRead(req.user.id));
});

const readOne = asyncController(async (req, res) => {
  res.json(await notificationsService.markOneRead({ notificationId: req.params.id, userId: req.user.id }));
});

module.exports = {
  list,
  readAll,
  readOne,
  summary,
};
