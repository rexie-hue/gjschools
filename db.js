const { Pool } = require('pg');

// Use DATABASE_URL from environment for production, fallback to local config for development
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
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