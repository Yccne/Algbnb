const { badRequest } = require('../utils/httpError');

const validateProfileUpdate = ({ nom, prenom, email, telephone, bio }) => {
  if (!nom || !prenom) {
    throw badRequest('Nom et prenom sont obligatoires.');
  }

  return {
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: email ? email.toLowerCase() : null,
    telephone: telephone || null,
    bio: bio || null,
  };
};

module.exports = {
  validateProfileUpdate,
};
