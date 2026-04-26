const jwtSecret = process.env.JWT_SECRET || 'change-me-local-dev-secret';

module.exports = {
  jwtSecret,
};
