const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../middlewares/ann');

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      role: user.role_type,
      email: user.email,
    },
    jwtSecret,
    { expiresIn: '7d' }
  );

const sanitizeUser = (user) => ({
  id: user.id,
  nom: user.nom,
  prenom: user.prenom,
  email: user.email,
  telephone: user.telephone,
  role_type: user.role_type,
  bio: user.bio,
  photo_profil: user.photo_profil,
  est_verifie: user.est_verifie,
  verification_niveau: user.verification_niveau,
  statut_compte: user.statut_compte,
  provider_source: user.provider_source,
  date_inscription: user.date_inscription,
});

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateResetToken = () => crypto.randomBytes(32).toString('hex');

module.exports = {
  signToken,
  sanitizeUser,
  hashToken,
  generateResetToken,
};
