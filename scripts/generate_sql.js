const fs = require('fs'); 
const data = JSON.parse(fs.readFileSync('lib/plantillas-seed-data.json')); 
let sql = 'BEGIN;\n\n'; 
sql += 'CREATE TABLE IF NOT EXISTS products (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, description text, currency text NOT NULL, cost_base numeric(10,2) NOT NULL, utility_fixed numeric(10,2) NOT NULL, utility_factor numeric(10,2) NOT NULL);\n'; 
sql += 'CREATE TABLE IF NOT EXISTS plantillas (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), nombre text NOT NULL, requerimiento text);\n'; 
sql += 'CREATE TABLE IF NOT EXISTS plantilla_items (plantilla_id uuid REFERENCES plantillas(id) ON DELETE CASCADE, sequence integer NOT NULL, product_id uuid REFERENCES products(id), qty numeric(10,2) NOT NULL DEFAULT 1);\n\n'; 

for (const p of data.products) { 
  sql += `INSERT INTO products (id, name, description, currency, cost_base, utility_fixed, utility_factor) VALUES ('${p.id}', '${p.name.replace(/'/g, "''")}', ${p.description ? "'" + p.description.replace(/'/g, "''") + "'" : 'NULL'}, '${p.currency}', ${p.cost_base}, ${p.utility_fixed}, ${p.utility_factor}) ON CONFLICT DO NOTHING;\n`; 
} 
sql += '\n'; 

for (const pl of data.plantillas) { 
  sql += `INSERT INTO plantillas (id, nombre, requerimiento) VALUES ('${pl.id}', '${pl.nombre.replace(/'/g, "''")}', ${pl.requerimiento ? "'" + pl.requerimiento.replace(/'/g, "''") + "'" : 'NULL'}) ON CONFLICT DO NOTHING;\n`; 
} 
sql += '\n'; 

for (const it of data.items) { 
  sql += `INSERT INTO plantilla_items (plantilla_id, sequence, product_id, qty) VALUES ('${it.plantilla_id}', ${it.sequence}, '${it.product_id}', ${it.qty});\n`; 
} 
sql += '\nCOMMIT;\n'; 

fs.writeFileSync('db/seed_plantillas.sql', sql); 
console.log('SQL generated at db/seed_plantillas.sql');
