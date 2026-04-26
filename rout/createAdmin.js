const bcrypt = require('bcryptjs');
const db = require('./db');

async function createAdmin() {
  const hash = await bcrypt.hash('admin123', 10);
  await db.query('DELETE FROM utilisateur WHERE email = $1', ['admin@algbnb.com']);
  await db.query(
    'INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role_type, provider_source) VALUES ($1,$2,$3,$4,$5,$6)',
    ['Admin', 'Algbnb', 'admin@algbnb.com', hash, 'admin', 'local']
  );
  console.log('Admin créé avec succès !');
  console.log('Email: admin@algbnb.com');
  console.log('Mot de passe: admin123');
  process.exit();
}

createAdmin().catch(err => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
