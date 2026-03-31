import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import seedData from '@/lib/plantillas-seed-data.json'

export async function POST() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS plantillas (
        id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre        text NOT NULL,
        requerimiento text
      )
    `)
    await client.query(`
      CREATE TABLE IF NOT EXISTS plantilla_items (
        id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        plantilla_id     uuid NOT NULL REFERENCES plantillas(id) ON DELETE CASCADE,
        product_id       uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        qty              numeric(14,4) NOT NULL DEFAULT 1,
        discount_percent numeric(6,2)  NOT NULL DEFAULT 0,
        sequence         int           NOT NULL DEFAULT 10
      )
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_plantilla_items_plantilla ON plantilla_items(plantilla_id)
    `)

    // Clear existing data
    await client.query('DELETE FROM plantilla_items')
    await client.query('DELETE FROM plantillas')
    await client.query('DELETE FROM products')

    // Insert products
    for (const p of seedData.products) {
      await client.query(
        `INSERT INTO products (id, name, description, currency, cost_base, utility_fixed, utility_factor)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [p.id, p.name, p.description, p.currency, p.cost_base, p.utility_fixed, p.utility_factor]
      )
    }

    // Insert plantillas
    for (const pl of seedData.plantillas) {
      await client.query(
        `INSERT INTO plantillas (id, nombre, requerimiento) VALUES ($1,$2,$3)`,
        [pl.id, pl.nombre, pl.requerimiento]
      )
    }

    // Insert plantilla_items
    for (const it of seedData.items) {
      await client.query(
        `INSERT INTO plantilla_items (id, plantilla_id, product_id, qty, discount_percent, sequence)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [it.id, it.plantilla_id, it.product_id, it.qty, it.discount_percent, it.sequence]
      )
    }

    await client.query('COMMIT')
    return NextResponse.json({
      success: true,
      message: `Seed completado: ${seedData.products.length} productos, ${seedData.plantillas.length} plantillas, ${seedData.items.length} elementos`,
    })
  } catch (error: unknown) {
    await client.query('ROLLBACK')
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  } finally {
    client.release()
  }
}
