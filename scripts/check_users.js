const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/cotizador' });
pool.query('SELECT username, role FROM users').then(res => {
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
});
