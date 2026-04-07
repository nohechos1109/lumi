import pool from '@/lib/db'

export interface Plantilla {
  id: string
  nombre: string
  requerimiento: string | null
  item_count?: number
}

export interface PlantillaItem {
  plantilla_id: string
  sequence: number
  product_id: string | null
  qty: string
  product_name?: string
  product_sku?: string
}

export async function listPlantillas(): Promise<Plantilla[]> {
  const { rows } = await pool.query(
    `SELECT p.*, COUNT(pi.plantilla_id) as item_count
     FROM plantillas p
     LEFT JOIN plantilla_items pi ON pi.plantilla_id = p.id
     GROUP BY p.id ORDER BY p.nombre`
  )
  return rows
}

export async function getPlantillaWithItems(id: string): Promise<{ plantilla: Plantilla; items: PlantillaItem[] } | null> {
  const { rows: [plantilla] } = await pool.query('SELECT * FROM plantillas WHERE id = $1', [id])
  if (!plantilla) return null
  const { rows: items } = await pool.query(
    `SELECT pi.*, pr.name as product_name, pr.sku as product_sku
     FROM plantilla_items pi
     LEFT JOIN products pr ON pr.id = pi.product_id
     WHERE pi.plantilla_id = $1 ORDER BY pi.sequence`,
    [id]
  )
  return { plantilla, items }
}

export async function createPlantilla(nombre: string, requerimiento?: string): Promise<Plantilla> {
  const { rows } = await pool.query(
    'INSERT INTO plantillas (nombre, requerimiento) VALUES ($1, $2) RETURNING *',
    [nombre, requerimiento ?? null]
  )
  return rows[0]
}

export async function updatePlantilla(id: string, nombre: string, requerimiento?: string): Promise<void> {
  await pool.query(
    'UPDATE plantillas SET nombre = $1, requerimiento = $2 WHERE id = $3',
    [nombre, requerimiento ?? null, id]
  )
}

export async function deletePlantilla(id: string): Promise<void> {
  await pool.query('DELETE FROM plantillas WHERE id = $1', [id])
}

export async function addPlantillaItem(plantillaId: string, productId: string, qty: number): Promise<void> {
  const { rows: [{ max }] } = await pool.query(
    'SELECT COALESCE(MAX(sequence), 0) as max FROM plantilla_items WHERE plantilla_id = $1',
    [plantillaId]
  )
  await pool.query(
    'INSERT INTO plantilla_items (plantilla_id, sequence, product_id, qty) VALUES ($1, $2, $3, $4)',
    [plantillaId, Number(max) + 1, productId, qty]
  )
}

export async function removePlantillaItem(plantillaId: string, sequence: number): Promise<void> {
  await pool.query(
    'DELETE FROM plantilla_items WHERE plantilla_id = $1 AND sequence = $2',
    [plantillaId, sequence]
  )
}

export async function updatePlantillaItem(plantillaId: string, sequence: number, qty: number): Promise<void> {
  await pool.query(
    'UPDATE plantilla_items SET qty = $1 WHERE plantilla_id = $2 AND sequence = $3',
    [qty, plantillaId, sequence]
  )
}
