const { Pool } = require('pg');

const config = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.PGHOST || process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.PGPORT || process.env.DB_PORT || 5432),
      database: process.env.PGDATABASE || process.env.DB_NAME || 'projet',
      user: process.env.PGUSER || process.env.DB_USER || 'postgres',
      password: process.env.PGPASSWORD || process.env.DB_PASSWORD || '',
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool(config);

pool.on('error', (error) => {
  console.error('[db] Erreur PostgreSQL:', error.message);
});

async function checkDatabaseConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT current_database() AS database_name, NOW() AS server_time');
    return result.rows[0];
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  query: (...args) => pool.query(...args),
  getClient: () => pool.connect(),
  checkDatabaseConnection,
};
