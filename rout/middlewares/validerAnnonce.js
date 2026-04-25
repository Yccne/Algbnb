const parseEquipements = (equipements) => {
  if (!equipements) return [];
  if (Array.isArray(equipements)) return equipements;
  if (typeof equipements === 'string') {
    try {
      const parsed = JSON.parse(equipements);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) {
      return equipements
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const parsePhotoUrls = (photoUrls) => {
  if (!photoUrls) return [];
  if (Array.isArray(photoUrls)) return photoUrls.filter(Boolean);
  if (typeof photoUrls === 'string') {
    try {
      const parsed = JSON.parse(photoUrls);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch (error) {
      return photoUrls
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
};

const validerAnnonce = (req, res, next) => {
  const {
    titre,
    description,
    type_logement,
    adresse,
    ville,
    nb_chambres,
    nb_lits,
    nb_salles_de_bain,
    capacite_accueil,
    prix_par_nuit,
  } = req.body;

  const erreurs = [];
  const equipements = parseEquipements(req.body.equipements);
  const photoUrls = parsePhotoUrls(req.body.photo_urls);

  if (!titre || titre.trim().length < 5) erreurs.push('Le titre doit contenir au moins 5 caractères.');
  if (!description || description.trim().length < 20) erreurs.push('La description doit contenir au moins 20 caractères.');
  if (!type_logement) erreurs.push('Le type de logement est obligatoire.');
  if (!adresse || adresse.trim().length < 8) erreurs.push('Une adresse complète est obligatoire.');
  if (!ville || ville.trim().length < 2) erreurs.push('La ville est obligatoire.');

  const numericFields = [
    ['nb_chambres', nb_chambres, 0],
    ['nb_lits', nb_lits, 1],
    ['nb_salles_de_bain', nb_salles_de_bain, 1],
    ['capacite_accueil', capacite_accueil, 1],
    ['prix_par_nuit', prix_par_nuit, 1],
  ];

  for (const [label, value, min] of numericFields) {
    const number = Number(value);
    if (!Number.isFinite(number) || number < min) {
      erreurs.push(`Le champ ${label} est invalide.`);
    }
  }

  if ((!req.files || req.files.length === 0) && photoUrls.length === 0) {
    erreurs.push('Ajoute au moins une photo de logement ou une URL de photo.');
  }

  if (erreurs.length > 0) {
    return res.status(400).json({ erreurs });
  }

  req.body.equipements = equipements;
  req.body.photo_urls = photoUrls;
  return next();
};

module.exports = { validerAnnonce, parseEquipements, parsePhotoUrls };
