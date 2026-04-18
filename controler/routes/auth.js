const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Inscription
router.post('/inscription', async (req, res) => {
  const { nom, prenom, email, mot_de_passe, telephone, role_type } = req.body;
  try {
    const hashMotDePasse = await bcrypt.hash(mot_de_passe, 10);
    const result = await pool.query(
      `INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, telephone, role_type)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nom, prenom, email, role_type`,
      [nom, prenom, email, hashMotDePasse, telephone, role_type]
    );
    const user = result.rows[0];

    if (role_type === 'hote') {
      await pool.query('INSERT INTO hote (id_utilisateur) VALUES ($1)', [user.id]);
    } else {
      await pool.query('INSERT INTO voyageur (id_utilisateur) VALUES ($1)', [user.id]);
    }

    const token = jwt.sign({ id: user.id, role: user.role_type }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

// Connexion
router.post('/connexion', async (req, res) => {
  const { email, mot_de_passe } = req.body;
  try {
    const result = await pool.query('SELECT * FROM utilisateur WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(404).json({ erreur: 'Utilisateur non trouvé' });

    const user = result.rows[0];
    const valide = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valide) return res.status(401).json({ erreur: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, role: user.role_type }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, nom: user.nom, prenom: user.prenom, email: user.email, role_type: user.role_type } });
  } catch (err) {
    res.status(500).json({ erreur: err.message });
  }
});

module.exports = router;