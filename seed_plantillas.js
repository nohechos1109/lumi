const XLSX = require('xlsx')
const { Pool } = require('pg')

const pool = new Pool({ host: '192.168.0.111', port: 5432, user: 'admin', password: 'admin', database: 'cotizador' })

function pad(n) { return String(n).padStart(12, '0') }
function productUUID(id) { return `00000000-0009-0000-0000-${pad(id)}` }
function plantillaUUID(id) { return `00000000-000a-0000-0000-${pad(id)}` }
function itemUUID(idx) { return `00000000-000b-0000-0000-${pad(idx)}` }

async function run() {
  const wb = XLSX.readFile('./plantillas.xlsx')

  const catalogo = XLSX.utils.sheet_to_json(wb.Sheets['catalogo'])
  const plantillaRows = XLSX.utils.sheet_to_json(wb.Sheets['Plantillas'])
  const elementos = XLSX.utils.sheet_to_json(wb.Sheets['elementos'])

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Clear dependent tables first
    await client.query('DELETE FROM plantilla_items')
    await client.query('DELETE FROM plantillas')
    await client.query('DELETE FROM products')

    // Insert products from catalogo
    for (const p of catalogo) {
      await client.query(
        `INSERT INTO products (id, name, description, currency, cost_base, utility_fixed, utility_factor)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          productUUID(p.ID),
          p.name || '',
          p.description || null,
          p.currency || 'MXN',
          p.cost_base || 0,
          p.utility_fixed || 0,
          p.utility_factor || 1,
        ]
      )
    }
    console.log(`✓ ${catalogo.length} productos insertados`)

    // Insert plantillas
    for (const pl of plantillaRows) {
      await client.query(
        `INSERT INTO plantillas (id, nombre, requerimiento) VALUES ($1, $2, $3)`,
        [plantillaUUID(pl['Plantilla ID']), pl['Plantilla'], pl['Requerimiento'] || null]
      )
    }
    console.log(`✓ ${plantillaRows.length} plantillas insertadas`)

    // Insert plantilla_items
    let idx = 1
    for (const el of elementos) {
      await client.query(
        `INSERT INTO plantilla_items (id, plantilla_id, product_id, qty, discount_percent, sequence)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          itemUUID(idx),
          plantillaUUID(el['plantilla id']),
          productUUID(el['producto id']),
          el['piezas'] || 1,
          el['descuento'] || 0,
          idx * 10,
        ]
      )
      idx++
    }
    console.log(`✓ ${elementos.length} elementos de plantilla insertados`)

    await client.query('COMMIT')
    console.log('SEED_SUCCESS')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('SEED_ERROR', e)
  } finally {
    client.release()
    pool.end()
  }
}

run()
