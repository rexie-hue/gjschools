const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'edumanage',
  password: 'AbenaAtaa@1',
  port: 5432,
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database pool error:', err);
});

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('Database connection test successful:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('Database connection test failed:', err.message);
    return false;
  }
}

testConnection();

process.on('SIGINT', () => {
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection
};