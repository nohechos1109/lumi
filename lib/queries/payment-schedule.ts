import pool from '@/lib/db'
import { getSale } from './sales'

export interface PaymentScheduleItem {
  id: string
  sale_id: string
  due_date: string
  amount: string
  label: string | null
  sequence: number
  state: 'pending' | 'paid'
  created_at: string
  overdue: boolean
}

export interface OverdueScheduleItem {
  id: string
  sale_id: string
  sale_number: string
  label: string | null
  due_date: string
  amount: string
  days_overdue: number
}

export interface ScheduleItemWithContext {
  id: string
  sale_id: string
  sale_number: string
  customer_id: string
  customer_name: string
  due_date: string
  amount: string
  label: string | null
  sequence: number
  state: 'pending' | 'paid'
  overdue: boolean
  days_overdue: number | null
}

export async function listScheduleItems(saleId: string): Promise<PaymentScheduleItem[]> {
  const { rows } = await pool.query(
    `SELECT id, sale_id, TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date, amount, label, sequence, state, created_at,
            (state = 'pending' AND due_date < CURRENT_DATE) AS overdue
     FROM payment_schedule_items WHERE sale_id = $1 ORDER BY sequence`,
    [saleId]
  )
  return rows
}

/**
 * Replace pending schedule items for a sale.
 * Paid items are preserved — only pending rows are deleted before re-inserting.
 */
export async function upsertSchedule(
  saleId: string,
  items: { due_date: string; amount: number; label?: string }[]
): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Only delete pending items — paid items must not be touched
    await client.query(
      "DELETE FROM payment_schedule_items WHERE sale_id = $1 AND state = 'pending'",
      [saleId]
    )

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

export async function markScheduleItemPaid(itemId: string): Promise<void> {
  await pool.query(
    "UPDATE payment_schedule_items SET state = 'paid' WHERE id = $1",
    [itemId]
  )
}

/**
 * Auto-mark schedule items as paid using FIFO logic.
 * Walks items in sequence order and marks as paid those covered by amount_paid on the sale.
 */
export async function autoMarkScheduleItems(saleId: string): Promise<void> {
  const sale = await getSale(saleId)
  if (!sale) return
  const amountPaid = Number(sale.amount_paid)
  if (amountPaid <= 0) return

  const items = await listScheduleItems(saleId)
  let runningSum = 0
  const toMark: string[] = []

  for (const item of items) {
    runningSum += Number(item.amount)
    if (item.state === 'pending' && runningSum <= amountPaid + 0.005) {
      toMark.push(item.id)
    }
  }

  if (toMark.length > 0) {
    await pool.query(
      "UPDATE payment_schedule_items SET state = 'paid' WHERE id = ANY($1)",
      [toMark]
    )
  }
}

/**
 * Returns all overdue (pending + past due_date) schedule items for a set of sales.
 * Used to detect which customers have payment delays after a payment is confirmed.
 */
export async function listOverdueScheduleItemsBySaleIds(
  saleIds: string[]
): Promise<OverdueScheduleItem[]> {
  if (saleIds.length === 0) return []
  const { rows } = await pool.query(
    `SELECT psi.id, psi.sale_id, s.number AS sale_number,
            psi.label, TO_CHAR(psi.due_date, 'YYYY-MM-DD') AS due_date,
            psi.amount, (CURRENT_DATE - psi.due_date)::int AS days_overdue
     FROM payment_schedule_items psi
     JOIN sales s ON s.id = psi.sale_id
     WHERE psi.sale_id = ANY($1)
       AND psi.state = 'pending'
       AND psi.due_date < CURRENT_DATE
     ORDER BY psi.due_date ASC`,
    [saleIds]
  )
  return rows
}

/**
 * Global list of all schedule items with sale and customer context.
 * Used by /convenios page. Overdue items appear first, then sorted by due_date ASC.
 */
export async function listScheduleItemsGlobal(filters?: {
  customerId?: string
  state?: 'pending' | 'paid' | 'overdue'
  dateFrom?: string
  dateTo?: string
}): Promise<ScheduleItemWithContext[]> {
  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (filters?.customerId) {
    conditions.push(`s.customer_id = $${idx++}`)
    values.push(filters.customerId)
  }

  if (filters?.state === 'paid') {
    conditions.push(`psi.state = 'paid'`)
  } else if (filters?.state === 'pending') {
    conditions.push(`psi.state = 'pending' AND psi.due_date >= CURRENT_DATE`)
  } else if (filters?.state === 'overdue') {
    conditions.push(`psi.state = 'pending' AND psi.due_date < CURRENT_DATE`)
  }

  if (filters?.dateFrom) {
    conditions.push(`psi.due_date >= $${idx++}`)
    values.push(filters.dateFrom)
  }
  if (filters?.dateTo) {
    conditions.push(`psi.due_date <= $${idx++}`)
    values.push(filters.dateTo)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query(
    `SELECT psi.id, psi.sale_id, s.number AS sale_number,
            s.customer_id, c.name AS customer_name,
            TO_CHAR(psi.due_date, 'YYYY-MM-DD') AS due_date,
            psi.amount, psi.label, psi.sequence, psi.state,
            (psi.state = 'pending' AND psi.due_date < CURRENT_DATE) AS overdue,
            CASE WHEN psi.state = 'pending' AND psi.due_date < CURRENT_DATE
                 THEN (CURRENT_DATE - psi.due_date)::int
                 ELSE NULL END AS days_overdue
     FROM payment_schedule_items psi
     JOIN sales s ON s.id = psi.sale_id
     JOIN contacts c ON c.id = s.customer_id
     ${where}
     ORDER BY
       CASE WHEN psi.state = 'pending' AND psi.due_date < CURRENT_DATE THEN 0 ELSE 1 END,
       psi.due_date ASC`,
    values
  )
  return rows
}
