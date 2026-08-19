const { Pool } = require('pg');
const pool = new Pool({ connectionString: require('./env').databaseUrl });
module.exports = { query: (text, params) => pool.query(text, params), pool };
