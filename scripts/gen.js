const fs = require('fs');
const xlsx = require('xlsx');
const wb = xlsx.readFile('catalogo.xlsx');
const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
let sql = 'ALTER TABLE products ADD COLUMN IF NOT EXISTS description text;\n\n';
data.forEach(p => {
  const name = p.name ? p.name.replace(/'/g, "''") : '';
  const desc = p.description ? p.description.replace(/'/g, "''") : '';
  const cb = p.cost_base || 0;
  const cur = p.currency || 'USD';
  const ufix = p.utility_fixed || 0;
  const ufac = p.utility_factor || 1;
  sql += `INSERT INTO products (sku, name, description, currency, cost_base, utility_fixed, utility_factor) VALUES ('SKU-' || substr(gen_random_uuid()::text, 1, 8), '${name}', '${desc}', '${cur}', ${cb}, ${ufix}, ${ufac});\n`;
});
fs.writeFileSync('import_catalogo.sql', sql);
console.log('SQL generado en import_catalogo.sql');
