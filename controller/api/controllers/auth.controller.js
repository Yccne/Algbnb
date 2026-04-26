const authService = require('../../../model/api/services/auth.service');
const { asyncController } = require('./controllerUtils');

const register = asyncController(async (req, res) => {
  res.status(201).json(await authService.register(req.body));
});

const login = asyncController(async (req, res) => {
  res.json(await authService.login(req.body));
});

const google = asyncController(async (req, res) => {
  res.json(await authService.loginWithGoogle(req.body));
});

const facebook = asyncController(async (req, res) => {
  res.json(await authService.loginWithFacebook(req.body));
});

const forgotPassword = asyncController(async (req, res) => {
  const clientUrl = (process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  res.json(await authService.forgotPassword(req.body, clientUrl));
});

const resetPassword = asyncController(async (req, res) => {
  res.json(await authService.resetPassword(req.body));
});

const me = asyncController(async (req, res) => {
  res.json(await authService.getMe(req.user.id));
});

const providers = (req, res) => {
  res.json(authService.getProviders());
};

module.exports = {
  forgotPassword,
  facebook,
  google,
  login,
  me,
  providers,
  register,
  resetPassword,
};
