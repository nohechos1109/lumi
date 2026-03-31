import pool from '@/lib/db'

export interface GlobalSettings { id: string; fx_mxn_per_usd: string }
export interface PaymentTerm { id: string; name: string }

export async function getSettings(): Promise<GlobalSettings | null> {
  const { rows } = await pool.query('SELECT id, fx_mxn_per_usd FROM global_settings LIMIT 1')
  return rows[0] ?? null
}

export async function updateFx(fx: number): Promise<void> {
  await pool.query('UPDATE global_settings SET fx_mxn_per_usd = $1', [fx])
}

export async function listPaymentTerms(): Promise<PaymentTerm[]> {
  const { rows } = await pool.query('SELECT id, name FROM payment_terms ORDER BY name')
  return rows
}

export async function createPaymentTerm(name: string): Promise<PaymentTerm> {
  const { rows } = await pool.query(
    'INSERT INTO payment_terms (name) VALUES ($1) RETURNING id, name', [name]
  )
  return rows[0]
}

export async function deletePaymentTerm(id: string): Promise<void> {
  await pool.query('DELETE FROM payment_terms WHERE id = $1', [id])
}
