const express = require('express');
const db = require('../db');
const { verifierToken, estAdmin } = require('../middlewares/ann');

const router = express.Router();

router.use(verifierToken, estAdmin);

router.get('/stats', async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT
          (SELECT COUNT(*) FROM utilisateur) AS nb_utilisateurs,
          (SELECT COUNT(*) FROM utilisateur WHERE role_type = 'hote') AS nb_hotes,
          (SELECT COUNT(*) FROM utilisateur WHERE role_type = 'voyageur') AS nb_voyageurs,
          (SELECT COUNT(*) FROM logement WHERE est_supprime = FALSE) AS nb_annonces,
          (SELECT COUNT(*) FROM reservation) AS nb_reservations,
          (SELECT COALESCE(SUM(montant_total), 0) FROM reservation WHERE statut IN ('confirmee', 'terminee')) AS revenu_total,
          (
            SELECT COALESCE(
              ROUND(
                COUNT(*) FILTER (WHERE statut IN ('annulee_hote', 'annulee_voyageur')) * 100.0 / NULLIF(COUNT(*), 0),
                2
              ),
              0
            )
            FROM reservation
          ) AS taux_annulation
      `
    );

    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT id, nom, prenom, email, telephone, role_type, statut_compte, est_verifie, date_inscription
        FROM utilisateur
        ORDER BY date_inscription DESC
      `
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  const { statut_compte } = req.body;
  if (!['actif', 'suspendu', 'bloque'].includes(statut_compte)) {
    return res.status(400).json({ erreur: 'Statut invalide.' });
  }

  try {
    const result = await db.query(
      'UPDATE utilisateur SET statut_compte = $1, date_mise_a_jour = NOW() WHERE id = $2 RETURNING id, statut_compte',
      [statut_compte, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Utilisateur introuvable.' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/annonces', async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT
          l.id,
          l.titre,
          l.ville,
          l.validation_statut,
          l.est_actif,
          l.date_creation,
          u.nom AS hote_nom,
          u.prenom AS hote_prenom
        FROM logement l
        JOIN utilisateur u ON u.id = l.id_hote
        WHERE l.est_supprime = FALSE
        ORDER BY l.date_creation DESC
      `
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.patch('/annonces/:id/validation', async (req, res) => {
  const { validation_statut } = req.body;
  if (!['en_attente', 'valide', 'refuse'].includes(validation_statut)) {
    return res.status(400).json({ erreur: 'Statut de validation invalide.' });
  }

  try {
    const result = await db.query(
      `
        UPDATE logement
        SET validation_statut = $1,
            est_actif = CASE WHEN $1 = 'valide' THEN est_actif ELSE FALSE END,
            date_mise_a_jour = NOW()
        WHERE id = $2
        RETURNING id, validation_statut, est_actif
      `,
      [validation_statut, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ erreur: 'Annonce introuvable.' });
    }
    return res.json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.get('/litiges', async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT
          l.*,
          u.nom AS auteur_nom,
          u.prenom AS auteur_prenom
        FROM litige l
        JOIN utilisateur u ON u.id = l.id_ouverture
        ORDER BY l.date_creation DESC
      `
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

router.post('/litiges', async (req, res) => {
  const { id_reservation, id_ouverture, sujet, description } = req.body;
  if (!id_ouverture || !sujet || !description) {
    return res.status(400).json({ erreur: 'Auteur, sujet et description sont requis.' });
  }

  try {
    const result = await db.query(
      `
        INSERT INTO litige (id_reservation, id_ouverture, sujet, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `,
      [id_reservation || null, id_ouverture, sujet, description]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    return res.status(500).json({ erreur: error.message });
  }
});

module.exports = router;
