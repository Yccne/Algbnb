const { Pool } = require('pg');

const pool = new Pool({
  host: '127.0.0.1',
  port: 5000,
  database: 'algbnb',
  user: 'postgres',
  password: 'chamsou667',
});

pool.connect()
  .then(() => console.log('✅ Connecté à PostgreSQL'))
  .catch(err => console.error('❌ Erreur connexion BDD:', err.message));

module.exports = pool;