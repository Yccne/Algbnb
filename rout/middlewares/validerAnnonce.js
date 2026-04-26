const {
  parseEquipements,
  parsePhotoUrls,
  validateAnnoncePayload,
} = require('../validators/annonces.validator');

const validerAnnonce = async (req, res, next) => {
  const validation = await validateAnnoncePayload(req.body, req.files, { requirePhoto: true });

  if (validation.erreurs.length > 0) {
    return res.status(400).json({ erreurs: validation.erreurs });
  }

  req.body.equipements = validation.equipements;
  req.body.photo_urls = validation.photoUrls;
  req.body.reverse_location = validation.reversedLocation;
  return next();
};

module.exports = {
  parseEquipements,
  parsePhotoUrls,
  validateAnnoncePayload,
  validerAnnonce,
};
