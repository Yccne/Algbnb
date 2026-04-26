const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../../model/api/config/auth.config');

const verifierToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erreur: 'Authentification requise.' });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch (error) {
    return res.status(403).json({ erreur: 'Token invalide ou expire.' });
  }
};

const exigerRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ erreur: "Vous n'avez pas les droits necessaires." });
  }
  return next();
};

const estHote = exigerRole('hote', 'admin');
const estAdmin = exigerRole('admin');

module.exports = { verifierToken, exigerRole, estHote, estAdmin, jwtSecret };
