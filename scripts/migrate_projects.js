const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'admin',
  password: 'admin',
  database: 'cotizador'
});

async function run() {
  try {
    console.log('Running migration: projects...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
          id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name          text NOT NULL,
          customer_id   uuid NOT NULL REFERENCES customers(id),
          date          date NOT NULL DEFAULT CURRENT_DATE,
          status        text NOT NULL CHECK (status IN ('draft', 'process', 'approved', 'demo', 'follow_up', 'closed', 'deleted')),
          description   text,
          user_id       uuid REFERENCES users(id),
          created_at    timestamptz NOT NULL DEFAULT now()
      )
    `);
    console.log('Table "projects" created.');

    await pool.query(`
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id)
    `);
    console.log('Added "project_id" column to quotes.');

    console.log('MIGRATION_SUCCESS');
  } catch (e) {
    console.error('MIGRATION_ERROR', e);
  } finally {
    await pool.end();
  }
}

run();
