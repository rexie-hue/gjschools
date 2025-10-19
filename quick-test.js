const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'edumanage',
  password: 'AbenaAtaa@1',
  port: 5432,
});

client.connect()
  .then(() => {
    console.log('✓ Successfully connected to PostgreSQL!');
    return client.query('SELECT NOW()');
  })
  .then((result) => {
    console.log('✓ Query successful:', result.rows[0].now);
    client.end();
  })
  .catch((err) => {
    console.error('✗ Connection failed:', err.message);
    client.end();
  });