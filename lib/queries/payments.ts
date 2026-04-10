import pool from '@/lib/db'
import { updateSaleNoteTotals } from './sale-notes'
import { updateSaleTotals } from './sales'

export interface Payment {
  id: string
  number: string
  sale_id: string
  state: 'draft' | 'confirmed' | 'cancelled'
  concept: string | null
  amount: string
  payment_method: string
  payment_date: string
  reference: string | null
  notes: string | null
  registered_by: string
  confirmed_by: string | null
  confirmed_at: string | null
  created_at: string
  // joined
  registered_by_name?: string
  confirmed_by_name?: string
}

export interface PaymentApplication {
  id: string
  payment_id: string
  sale_note_id: string
  amount: string
  created_at: string
  // joined
  note_number?: string
}

const PAYMENT_SELECT = `
  SELECT p.*,
         u1.username AS registered_by_name,
         u2.username AS confirmed_by_name
  FROM payments p
  LEFT JOIN users u1 ON u1.id = p.registered_by
  LEFT JOIN users u2 ON u2.id = p.confirmed_by
`

export async function listPaymentsBySale(saleId: string): Promise<Payment[]> {
  const { rows } = await pool.query(
    `${PAYMENT_SELECT} WHERE p.sale_id = $1 ORDER BY p.payment_date DESC, p.created_at DESC`,
    [saleId]
  )
  return rows
}

export async function getPayment(id: string): Promise<Payment | null> {
  const { rows } = await pool.query(`${PAYMENT_SELECT} WHERE p.id = $1`, [id])
  return rows[0] ?? null
}

export async function createPayment(data: {
  saleId: string
  concept?: string
  amount: number
  paymentMethod: string
  paymentDate: string
  reference?: string
  notes?: string
  registeredBy: string
}): Promise<Payment> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const { rows: last } = await pool.query(
    "SELECT number FROM payments WHERE number LIKE $1 ORDER BY number DESC LIMIT 1",
    [`PAG-${dateStr}-%`]
  )
  let seq = 1
  if (last.length > 0) {
    const parts = last[0].number.split('-')
    seq = parseInt(parts[parts.length - 1], 10) + 1
  }
  const number = `PAG-${dateStr}-${String(seq).padStart(4, '0')}`

  const { rows } = await pool.query(
    `INSERT INTO payments
       (number, sale_id, state, concept, amount, payment_method, payment_date, reference, notes, registered_by)
     VALUES ($1, $2, 'draft', $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [number, data.saleId, data.concept ?? null, data.amount, data.paymentMethod,
     data.paymentDate, data.reference ?? null, data.notes ?? null, data.registeredBy]
  )
  return rows[0]
}

export async function confirmPayment(id: string, confirmedBy: string): Promise<void> {
  await pool.query(
    `UPDATE payments SET state = 'confirmed', confirmed_by = $1, confirmed_at = now()
     WHERE id = $2 AND state = 'draft'`,
    [confirmedBy, id]
  )
}

/**
 * Cancel a payment: void all applications and recalculate totals.
 */
export async function cancelPayment(id: string, saleId: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Get affected note IDs before deleting applications
    const { rows: apps } = await client.query(
      'SELECT DISTINCT sale_note_id FROM payment_applications WHERE payment_id = $1',
      [id]
    )

    // Delete applications
    await client.query('DELETE FROM payment_applications WHERE payment_id = $1', [id])

    // Cancel the payment
    await client.query(
      "UPDATE payments SET state = 'cancelled' WHERE id = $1",
      [id]
    )

    await client.query('COMMIT')

    // Recalculate totals outside transaction
    for (const app of apps) {
      await updateSaleNoteTotals(app.sale_note_id)
    }
    await updateSaleTotals(saleId)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/**
 * Apply (part of) a confirmed payment to a specific note.
 */
export async function applyPaymentToNote(
  paymentId: string,
  noteId: string,
  amount: number,
  saleId: string
): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Validate payment is confirmed
    const { rows: [payment] } = await client.query(
      "SELECT id, amount, state FROM payments WHERE id = $1",
      [paymentId]
    )
    if (!payment || payment.state !== 'confirmed') {
      throw new Error('El pago debe estar confirmado para aplicar')
    }

    // Validate unapplied amount
    const { rows: [{ total_applied }] } = await client.query(
      'SELECT COALESCE(SUM(amount), 0) AS total_applied FROM payment_applications WHERE payment_id = $1',
      [paymentId]
    )
    const unapplied = Number(payment.amount) - Number(total_applied)
    if (amount > unapplied + 0.005) {
      throw new Error(`El monto excede el saldo disponible del pago ($${unapplied.toFixed(2)})`)
    }

    // Validate note balance
    const { rows: [note] } = await client.query(
      'SELECT id, amount_balance FROM sale_notes WHERE id = $1',
      [noteId]
    )
    if (!note) throw new Error('Nota no encontrada')
    if (amount > Number(note.amount_balance) + 0.005) {
      throw new Error(`El monto excede el saldo de la nota ($${Number(note.amount_balance).toFixed(2)})`)
    }

    // Insert application
    await client.query(
      'INSERT INTO payment_applications (payment_id, sale_note_id, amount) VALUES ($1, $2, $3)',
      [paymentId, noteId, amount]
    )

    await client.query('COMMIT')

    // Recalculate totals
    await updateSaleNoteTotals(noteId)
    await updateSaleTotals(saleId)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getUnappliedAmount(paymentId: string): Promise<number> {
  const { rows: [{ amount }] } = await pool.query(
    'SELECT amount FROM payments WHERE id = $1',
    [paymentId]
  )
  const { rows: [{ total }] } = await pool.query(
    'SELECT COALESCE(SUM(amount), 0) AS total FROM payment_applications WHERE payment_id = $1',
    [paymentId]
  )
  return Number(amount) - Number(total)
}

export async function listApplicationsByPayment(paymentId: string): Promise<PaymentApplication[]> {
  const { rows } = await pool.query(
    `SELECT pa.*, sn.number AS note_number
     FROM payment_applications pa
     LEFT JOIN sale_notes sn ON sn.id = pa.sale_note_id
     WHERE pa.payment_id = $1
     ORDER BY pa.created_at`,
    [paymentId]
  )
  return rows
}

export async function listApplicationsByNote(noteId: string): Promise<PaymentApplication[]> {
  const { rows } = await pool.query(
    `SELECT pa.*, p.number AS payment_number
     FROM payment_applications pa
     LEFT JOIN payments p ON p.id = pa.payment_id
     WHERE pa.sale_note_id = $1
     ORDER BY pa.created_at`,
    [noteId]
  )
  return rows
}
