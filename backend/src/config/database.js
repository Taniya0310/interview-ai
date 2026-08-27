const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.databaseUrl,
//   ssl: {
//     rejectUnauthorized: false,
//   },
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};