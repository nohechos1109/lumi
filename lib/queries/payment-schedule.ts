import pool from '@/lib/db'

export interface PaymentScheduleItem {
  id: string
  sale_id: string
  due_date: string
  amount: string
  label: string | null
  sequence: number
  created_at: string
}

export async function listScheduleItems(saleId: string): Promise<PaymentScheduleItem[]> {
  const { rows } = await pool.query(
    'SELECT * FROM payment_schedule_items WHERE sale_id = $1 ORDER BY sequence',
    [saleId]
  )
  return rows
}

/**
 * Replace entire payment schedule for a sale.
 */
export async function upsertSchedule(
  saleId: string,
  items: { due_date: string; amount: number; label?: string }[]
): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query('DELETE FROM payment_schedule_items WHERE sale_id = $1', [saleId])

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      await client.query(
        `INSERT INTO payment_schedule_items (sale_id, due_date, amount, label, sequence)
         VALUES ($1, $2, $3, $4, $5)`,
        [saleId, item.due_date, item.amount, item.label ?? null, i + 1]
      )
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function deleteSchedule(saleId: string): Promise<void> {
  await pool.query('DELETE FROM payment_schedule_items WHERE sale_id = $1', [saleId])
}
