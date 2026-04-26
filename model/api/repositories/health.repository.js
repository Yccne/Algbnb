const database = require('./database.repository');

const getDatabaseStatus = async () => {
  const result = await database.query('SELECT current_database() AS database_name, NOW() AS server_time');
  return result.rows[0];
};

module.exports = {
  getDatabaseStatus,
};
