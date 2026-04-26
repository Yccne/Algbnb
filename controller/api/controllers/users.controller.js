const usersService = require('../../../model/api/services/users.service');
const { asyncController } = require('./controllerUtils');

const me = asyncController(async (req, res) => {
  res.json(await usersService.getMe(req.user.id));
});

const updateMe = asyncController(async (req, res) => {
  res.json(await usersService.updateMe({ userId: req.user.id, payload: req.body }));
});

const updatePhoto = asyncController(async (req, res) => {
  res.json(await usersService.updatePhoto({ userId: req.user.id, file: req.file }));
});

const publicProfile = asyncController(async (req, res) => {
  res.json(await usersService.getPublicProfile(req.params.id));
});

module.exports = {
  me,
  publicProfile,
  updateMe,
  updatePhoto,
};
