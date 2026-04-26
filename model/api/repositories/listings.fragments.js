const listingSelect = `
  SELECT
    l.*,
    u.nom AS hote_nom,
    u.prenom AS hote_prenom,
    u.photo_profil AS hote_photo,
    u.est_verifie AS hote_verifie,
    COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT lp.url_photo), NULL), '{}') AS photos,
    COALESCE(ARRAY_REMOVE(ARRAY_AGG(DISTINCT le.nom_equipement), NULL), '{}') AS equipements,
    COALESCE(ROUND(AVG(a.note_logement)::numeric, 2), 0) AS note_moyenne,
    COUNT(DISTINCT a.id) AS nb_avis
  FROM logement l
  JOIN utilisateur u ON u.id = l.id_hote
  LEFT JOIN logement_photo lp ON lp.id_logement = l.id
  LEFT JOIN logement_equipement le ON le.id_logement = l.id
  LEFT JOIN avis a ON a.id_logement = l.id AND a.est_visible = TRUE
`;

const listingGroupBy = `
  GROUP BY l.id, u.id
`;

module.exports = {
  listingGroupBy,
  listingSelect,
};
