const usersRepository = require('../repositories/users.repository');
const { validateProfileUpdate } = require('../validators/users.validator');
const { sanitizeUser } = require('../utils/auth');
const { badRequest, conflict, notFound } = require('../utils/httpError');

const getMe = async (userId) => {
  const user = await usersRepository.findById(userId);
  if (!user) {
    throw notFound('Utilisateur introuvable.');
  }
  const stats = await usersRepository.getStats(userId);
  return { user: sanitizeUser(user), stats };
};

const updateMe = async ({ userId, payload }) => {
  const data = validateProfileUpdate(payload);
  try {
    const user = await usersRepository.updateProfile({ userId, ...data });
    return { user: sanitizeUser(user) };
  } catch (error) {
    if (usersRepository.isUniqueViolation(error)) {
      throw conflict('Cet e-mail ou ce telephone est deja utilise.');
    }
    throw error;
  }
};

const updatePhoto = async ({ userId, file }) => {
  if (!file) {
    throw badRequest('Photo manquante.');
  }
  const user = await usersRepository.updatePhoto({ userId, photoPath: `/uploads/profiles/${file.filename}` });
  return { user: sanitizeUser(user) };
};

const getPublicProfile = async (userId) => {
  const profile = await usersRepository.findPublicProfile(userId);
  if (!profile) {
    throw notFound('Profil introuvable.');
  }
  return profile;
};

module.exports = {
  getMe,
  getPublicProfile,
  updateMe,
  updatePhoto,
};
