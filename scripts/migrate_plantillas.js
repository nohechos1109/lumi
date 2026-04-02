const { Pool } = require('pg')
const pool = new Pool({ host: '192.168.0.111', port: 5432, user: 'admin', password: 'admin', database: 'cotizador' })

pool.query(`
  CREATE TABLE IF NOT EXISTS plantillas (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        text NOT NULL,
    requerimiento text
  );
  CREATE TABLE IF NOT EXISTS plantilla_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    plantilla_id    uuid NOT NULL REFERENCES plantillas(id) ON DELETE CASCADE,
    product_id      uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qty             numeric(14,4) NOT NULL DEFAULT 1,
    discount_percent numeric(6,2) NOT NULL DEFAULT 0,
    sequence        int NOT NULL DEFAULT 10
  );
  CREATE INDEX IF NOT EXISTS idx_plantilla_items_plantilla ON plantilla_items(plantilla_id);
`)
  .then(() => console.log('MIGRATION_SUCCESS: plantillas + plantilla_items created'))
  .catch(e => console.error('MIGRATION_ERROR', e))
  .finally(() => pool.end())
