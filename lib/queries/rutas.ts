import pool from '@/lib/db'

export interface Ruta {
  id: string
  name: string
  cliente_id: string | null
  cliente_name?: string
  created_at: string
}

export async function getRutas(): Promise<Ruta[]> {
  const { rows } = await pool.query(`
    SELECT r.*, c.name AS cliente_name
    FROM rutas r
    LEFT JOIN contacts c ON c.id = r.cliente_id
    ORDER BY r.name
  `)
  return rows
}

export async function getRuta(id: string): Promise<Ruta | null> {
  const { rows } = await pool.query(`
    SELECT r.*, c.name AS cliente_name
    FROM rutas r
    LEFT JOIN contacts c ON c.id = r.cliente_id
    WHERE r.id = $1
  `, [id])
  return rows[0] ?? null
}

export async function createRuta(name: string, cliente_id: string | null): Promise<Ruta> {
  const { rows } = await pool.query(
    'INSERT INTO rutas (name, cliente_id) VALUES ($1, $2) RETURNING *',
    [name, cliente_id]
  )
  return rows[0]
}

export async function updateRuta(id: string, name: string, cliente_id: string | null): Promise<void> {
  await pool.query('UPDATE rutas SET name = $1, cliente_id = $2 WHERE id = $3', [name, cliente_id, id])
}

export async function deleteRuta(id: string): Promise<void> {
  await pool.query('DELETE FROM rutas WHERE id = $1', [id])
}
