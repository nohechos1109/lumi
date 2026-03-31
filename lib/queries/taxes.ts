import pool from '@/lib/db'

export interface Tax { id: string; name: string; rate: string }

export async function listTaxes(): Promise<Tax[]> {
  const { rows } = await pool.query('SELECT id, name, rate FROM taxes ORDER BY name')
  return rows
}

export async function createTax(name: string, rate: number): Promise<Tax> {
  const { rows } = await pool.query(
    'INSERT INTO taxes (name, rate) VALUES ($1, $2) RETURNING id, name, rate', [name, rate]
  )
  return rows[0]
}

export async function updateTax(id: string, data: { name?: string; rate?: number }): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  if (data.name !== undefined) { fields.push(`name = $${i++}`); values.push(data.name) }
  if (data.rate !== undefined) { fields.push(`rate = $${i++}`); values.push(data.rate) }
  if (!fields.length) return
  values.push(id)
  await pool.query(`UPDATE taxes SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteTax(id: string): Promise<void> {
  await pool.query('DELETE FROM taxes WHERE id = $1', [id])
}
