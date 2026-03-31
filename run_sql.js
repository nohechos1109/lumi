const fs = require('fs');
const { Pool } = require('pg');
const pool = new Pool({ host: '192.168.0.111', port: 5432, user: 'admin', password: 'admin', database: 'cotizador' });

async function run() {
  try {
    const sql = fs.readFileSync('import_catalogo.sql', 'utf8');
    await pool.query(sql);
    console.log('MIGRATION_SUCCESS');
  } catch (e) {
    console.error('MIGRATION_ERROR', e);
  } finally {
    await pool.end();
  }
}
run();
