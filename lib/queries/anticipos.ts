import pool from '@/lib/db'

export interface Anticipo {
  id: string
  number: string
  sale_id: string
  payment_id: string
  concept: string | null
  created_at: string
}

export async function createAnticipo(data: {
  saleId: string
  paymentId: string
  concept?: string
}): Promise<Anticipo> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const { rows: last } = await pool.query(
    "SELECT number FROM sale_anticipos WHERE number LIKE $1 ORDER BY number DESC LIMIT 1",
    [`ANT-${dateStr}-%`]
  )
  let seq = 1
  if (last.length > 0) {
    const parts = last[0].number.split('-')
    seq = parseInt(parts[parts.length - 1], 10) + 1
  }
  const number = `ANT-${dateStr}-${String(seq).padStart(4, '0')}`

  const { rows } = await pool.query(
    `INSERT INTO sale_anticipos (number, sale_id, payment_id, concept)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [number, data.saleId, data.paymentId, data.concept ?? null]
  )
  return rows[0]
}

/** Anticipos for a sale that still have unapplied balance, oldest first (FIFO). */
export async function getAvailableAnticipoBySale(
  saleId: string
): Promise<{ payment_id: string; available: number }[]> {
  const { rows } = await pool.query(`
    SELECT
      sa.payment_id,
      (cp.amount - COALESCE(apl.applied, 0))::numeric(14,2) AS available
    FROM sale_anticipos sa
    JOIN customer_payments cp ON cp.id = sa.payment_id
    LEFT JOIN (
      SELECT payment_id, SUM(amount) AS applied
      FROM payment_applications
      GROUP BY payment_id
    ) apl ON apl.payment_id = sa.payment_id
    WHERE sa.sale_id = $1
      AND cp.state = 'confirmed'
      AND (cp.amount - COALESCE(apl.applied, 0)) > 0.005
    ORDER BY sa.created_at ASC
  `, [saleId])
  return rows.map(r => ({ payment_id: r.payment_id, available: Number(r.available) }))
}

/** Total unapplied anticipo credit for a sale. */
export async function getTotalAvailableAnticipo(saleId: string): Promise<number> {
  const { rows } = await pool.query(`
    SELECT COALESCE(SUM(cp.amount - COALESCE(apl.applied, 0)), 0)::numeric(14,2) AS total
    FROM sale_anticipos sa
    JOIN customer_payments cp ON cp.id = sa.payment_id
    LEFT JOIN (
      SELECT payment_id, SUM(amount) AS applied
      FROM payment_applications
      GROUP BY payment_id
    ) apl ON apl.payment_id = sa.payment_id
    WHERE sa.sale_id = $1
      AND cp.state = 'confirmed'
  `, [saleId])
  return Number(rows[0]?.total ?? 0)
}
