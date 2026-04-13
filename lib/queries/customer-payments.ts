import pool from '@/lib/db'
import { updateSaleNoteTotals } from './sale-notes'
import { updateSaleTotals } from './sales'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CustomerPayment {
  id: string
  number: string
  customer_id: string
  state: 'draft' | 'confirmed' | 'cancelled'
  concept: string | null
  amount: string
  payment_method: string
  payment_date: string
  reference: string | null
  registered_by: string
  created_at: string
  // joined
  customer_name?: string
  registered_by_name?: string
  // computed
  amount_applied?: string
  amount_available?: string
}

export interface PaymentApplication {
  id: string
  payment_id: string
  sale_note_id: string
  amount: string
  created_at: string
  // joined
  note_number?: string
  sale_number?: string
}

// ── Select fragment ───────────────────────────────────────────────────────────

const CP_SELECT = `
  SELECT
    cp.id, cp.number, cp.customer_id, cp.state, cp.concept, cp.amount,
    cp.payment_method,
    TO_CHAR(cp.payment_date, 'YYYY-MM-DD') AS payment_date,
    cp.reference, cp.registered_by,
    TO_CHAR(cp.created_at, 'YYYY-MM-DD') AS created_at,
    c.name  AS customer_name,
    u.username AS registered_by_name,
    COALESCE(apl.applied, 0)::numeric(14,2)::text              AS amount_applied,
    (cp.amount - COALESCE(apl.applied, 0))::numeric(14,2)::text AS amount_available
  FROM customer_payments cp
  JOIN contacts c ON c.id = cp.customer_id
  LEFT JOIN users u ON u.id = cp.registered_by
  LEFT JOIN (
    SELECT payment_id, SUM(amount) AS applied
    FROM payment_applications
    GROUP BY payment_id
  ) apl ON apl.payment_id = cp.id
`

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getCustomerPayment(id: string): Promise<CustomerPayment | null> {
  const { rows } = await pool.query(`${CP_SELECT} WHERE cp.id = $1`, [id])
  return rows[0] ?? null
}

export async function listPaymentsByCustomer(customerId: string): Promise<CustomerPayment[]> {
  const { rows } = await pool.query(
    `${CP_SELECT} WHERE cp.customer_id = $1 ORDER BY cp.payment_date DESC, cp.created_at DESC`,
    [customerId]
  )
  return rows
}

// ── Applications scoped to a sale ─────────────────────────────────────────────

export interface SalePaymentApplication {
  payment_id: string
  note_id: string
  note_number: string
  amount: string
}

/**
 * All payment applications whose note belongs to a given sale.
 * Used to show "Para: NTA-XXX ($N)" in the ventas detail page.
 */
export async function listApplicationsBySalePayments(saleId: string): Promise<SalePaymentApplication[]> {
  const { rows } = await pool.query(`
    SELECT pa.payment_id,
           pa.sale_note_id AS note_id,
           sn.number AS note_number,
           pa.amount::text
    FROM payment_applications pa
    JOIN sale_notes sn ON sn.id = pa.sale_note_id
    WHERE sn.sale_id = $1
    ORDER BY pa.created_at ASC
  `, [saleId])
  return rows
}

/**
 * Payments that have at least one application to a note in the given sale.
 * Used in the ventas detail page.
 */
export async function listPaymentsBySale(saleId: string): Promise<CustomerPayment[]> {
  const { rows } = await pool.query(
    `${CP_SELECT}
     WHERE cp.id IN (
       SELECT DISTINCT pa.payment_id
       FROM payment_applications pa
       JOIN sale_notes sn ON sn.id = pa.sale_note_id
       WHERE sn.sale_id = $1
     )
     ORDER BY cp.payment_date DESC, cp.created_at DESC`,
    [saleId]
  )
  return rows
}

/**
 * Full list for the /pagos page.
 * If userId is provided, only customers that have at least one sale
 * belonging to that user are shown.
 */
export async function listAllCustomerPayments(userId?: string): Promise<CustomerPayment[]> {
  const params: (string)[] = []
  const where = userId
    ? `WHERE cp.customer_id IN (
         SELECT DISTINCT customer_id FROM sales WHERE user_id = $${params.push(userId)}
       )`
    : ''
  const { rows } = await pool.query(
    `${CP_SELECT} ${where} ORDER BY cp.payment_date DESC, cp.created_at DESC`,
    params
  )
  return rows
}

// ── Credit helpers ────────────────────────────────────────────────────────────

/** Total unspent credit for a customer across all confirmed payments. */
export async function getCustomerAvailableCredit(customerId: string): Promise<number> {
  const { rows } = await pool.query(`
    SELECT COALESCE(SUM(cp.amount - COALESCE(apl.applied, 0)), 0)::numeric(14,2) AS credit
    FROM customer_payments cp
    LEFT JOIN (
      SELECT payment_id, SUM(amount) AS applied
      FROM payment_applications
      GROUP BY payment_id
    ) apl ON apl.payment_id = cp.id
    WHERE cp.customer_id = $1 AND cp.state = 'confirmed'
  `, [customerId])
  return Number(rows[0]?.credit ?? 0)
}

/** Returns confirmed payments with available > 0, oldest first (FIFO for applying). */
export async function getAvailablePaymentsByCustomer(
  customerId: string
): Promise<{ payment_id: string; available: number }[]> {
  const { rows } = await pool.query(`
    SELECT
      cp.id AS payment_id,
      (cp.amount - COALESCE(apl.applied, 0))::numeric(14,2) AS available
    FROM customer_payments cp
    LEFT JOIN (
      SELECT payment_id, SUM(amount) AS applied
      FROM payment_applications
      GROUP BY payment_id
    ) apl ON apl.payment_id = cp.id
    WHERE cp.customer_id = $1
      AND cp.state = 'confirmed'
      AND (cp.amount - COALESCE(apl.applied, 0)) > 0.005
    ORDER BY cp.created_at ASC
  `, [customerId])
  return rows.map(r => ({ payment_id: r.payment_id, available: Number(r.available) }))
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Create a customer payment as draft.
 * Must be confirmed via confirmCustomerPayment() before it can be applied.
 * If `confirmed` is true, creates directly as confirmed (used by cobranza/abono flow).
 */
export async function createCustomerPayment(data: {
  customerId: string
  concept?: string
  amount: number
  paymentMethod: string
  paymentDate: string
  reference?: string
  registeredBy: string
  confirmed?: boolean
}): Promise<CustomerPayment> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const prefix = `PAG-${dateStr}-`
  const state = data.confirmed ? 'confirmed' : 'draft'

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    // Advisory lock keyed on the date integer — serializes number generation per day
    await client.query('SELECT pg_advisory_xact_lock($1)', [parseInt(dateStr, 10)])

    const { rows: last } = await client.query(
      "SELECT number FROM customer_payments WHERE number LIKE $1 ORDER BY number DESC LIMIT 1",
      [`${prefix}%`]
    )
    let seq = 1
    if (last.length > 0) {
      const parts = last[0].number.split('-')
      seq = parseInt(parts[parts.length - 1], 10) + 1
    }
    const number = `${prefix}${String(seq).padStart(4, '0')}`

    const { rows } = await client.query(
      `INSERT INTO customer_payments
         (number, customer_id, state, concept, amount, payment_method, payment_date, reference, registered_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [number, data.customerId, state, data.concept ?? null, data.amount, data.paymentMethod,
       data.paymentDate, data.reference ?? null, data.registeredBy]
    )

    await client.query('COMMIT')
    return rows[0]
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/**
 * Confirm a draft payment, changing its state to 'confirmed'.
 */
export async function confirmCustomerPayment(id: string): Promise<void> {
  const { rowCount } = await pool.query(
    "UPDATE customer_payments SET state = 'confirmed' WHERE id = $1 AND state = 'draft'",
    [id]
  )
  if (!rowCount) throw new Error('El pago no está en borrador o no existe')
}

/**
 * Update a draft payment. Only drafts can be edited.
 */
export async function updateCustomerPayment(
  id: string,
  data: { concept?: string | null; amount?: number; paymentMethod?: string; paymentDate?: string; reference?: string | null }
): Promise<CustomerPayment> {
  const fields: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (data.amount !== undefined)        { fields.push(`amount = $${idx++}`);         values.push(data.amount) }
  if (data.paymentMethod !== undefined)  { fields.push(`payment_method = $${idx++}`); values.push(data.paymentMethod) }
  if (data.paymentDate !== undefined)    { fields.push(`payment_date = $${idx++}`);   values.push(data.paymentDate) }
  if (data.concept !== undefined)        { fields.push(`concept = $${idx++}`);        values.push(data.concept) }
  if (data.reference !== undefined)      { fields.push(`reference = $${idx++}`);      values.push(data.reference) }

  if (fields.length === 0) throw new Error('Nada que actualizar')

  values.push(id)
  const { rows } = await pool.query(
    `UPDATE customer_payments SET ${fields.join(', ')} WHERE id = $${idx} AND state = 'draft' RETURNING *`,
    values
  )
  if (rows.length === 0) {
    const { rows: check } = await pool.query(
      'SELECT state FROM customer_payments WHERE id = $1',
      [id]
    )
    if (check.length === 0) throw new Error('Pago no encontrado')
    throw new Error(`El pago no se puede editar (estado: ${check[0].state})`)
  }
  return rows[0]
}

/**
 * Cancel a payment: set state='cancelled'.
 * Existing applications become invisible to totals (totals only count confirmed payments).
 * Then recalculate all affected notes and sales.
 */
export async function cancelCustomerPayment(id: string): Promise<void> {
  // Get affected notes & sales before cancelling
  const { rows: apps } = await pool.query(
    `SELECT pa.sale_note_id, sn.sale_id
     FROM payment_applications pa
     JOIN sale_notes sn ON sn.id = pa.sale_note_id
     WHERE pa.payment_id = $1`,
    [id]
  )

  await pool.query(
    "UPDATE customer_payments SET state = 'cancelled' WHERE id = $1",
    [id]
  )

  const noteIds = [...new Set(apps.map(a => a.sale_note_id))]
  const saleIds = [...new Set(apps.map(a => a.sale_id))]
  await Promise.all(noteIds.map(nid => updateSaleNoteTotals(nid)))
  await Promise.all(saleIds.map(sid => updateSaleTotals(sid)))
}

/**
 * Apply (part of) a confirmed payment to a specific note.
 * Validates payment state, unapplied balance, and note balance.
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

    const { rows: [cp] } = await client.query(
      'SELECT id, amount, state FROM customer_payments WHERE id = $1',
      [paymentId]
    )
    if (!cp || cp.state !== 'confirmed') {
      throw new Error('El pago debe estar confirmado para aplicar')
    }

    const { rows: [{ total_applied }] } = await client.query(
      'SELECT COALESCE(SUM(amount), 0) AS total_applied FROM payment_applications WHERE payment_id = $1',
      [paymentId]
    )
    const unapplied = Number(cp.amount) - Number(total_applied)
    if (amount > unapplied + 0.005) {
      throw new Error(`El monto excede el saldo disponible del pago ($${unapplied.toFixed(2)})`)
    }

    const { rows: [note] } = await client.query(
      'SELECT id, amount_balance FROM sale_notes WHERE id = $1',
      [noteId]
    )
    if (!note) throw new Error('Nota no encontrada')
    if (amount > Number(note.amount_balance) + 0.005) {
      throw new Error(`El monto excede el saldo de la nota ($${Number(note.amount_balance).toFixed(2)})`)
    }

    await client.query(
      'INSERT INTO payment_applications (payment_id, sale_note_id, amount) VALUES ($1, $2, $3)',
      [paymentId, noteId, amount]
    )

    await client.query('COMMIT')

    await updateSaleNoteTotals(noteId)
    await updateSaleTotals(saleId)
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Note payment history (for PDFs) ──────────────────────────────────────────

export interface NotePaymentHistoryItem {
  seq: number
  payment_number: string
  payment_date: string
  amount: string
  payment_method: string
  reference: string | null
  registered_by_name: string | null
}

export async function listPaymentHistoryByNote(noteId: string): Promise<NotePaymentHistoryItem[]> {
  const { rows } = await pool.query(`
    SELECT
      ROW_NUMBER() OVER (ORDER BY cp.payment_date ASC, pa.created_at ASC)::int AS seq,
      cp.number AS payment_number,
      TO_CHAR(cp.payment_date, 'YYYY-MM-DD') AS payment_date,
      pa.amount::text,
      cp.payment_method,
      cp.reference,
      u.username AS registered_by_name
    FROM payment_applications pa
    JOIN customer_payments cp ON cp.id = pa.payment_id
    LEFT JOIN users u ON u.id = cp.registered_by
    WHERE pa.sale_note_id = $1 AND cp.state = 'confirmed'
    ORDER BY cp.payment_date ASC, pa.created_at ASC
  `, [noteId])
  return rows
}

// ── Applications ──────────────────────────────────────────────────────────────

export async function listApplicationsByPayment(paymentId: string): Promise<PaymentApplication[]> {
  const { rows } = await pool.query(`
    SELECT pa.id, pa.payment_id, pa.sale_note_id, pa.amount::text,
           TO_CHAR(pa.created_at, 'YYYY-MM-DD') AS created_at,
           sn.number AS note_number,
           s.number  AS sale_number
    FROM payment_applications pa
    LEFT JOIN sale_notes sn ON sn.id = pa.sale_note_id
    LEFT JOIN sales s ON s.id = sn.sale_id
    WHERE pa.payment_id = $1
    ORDER BY pa.created_at
  `, [paymentId])
  return rows
}

export async function listApplicationsByNote(noteId: string): Promise<PaymentApplication[]> {
  const { rows } = await pool.query(`
    SELECT pa.id, pa.payment_id, pa.sale_note_id, pa.amount::text,
           TO_CHAR(pa.created_at, 'YYYY-MM-DD') AS created_at,
           cp.number AS payment_number
    FROM payment_applications pa
    LEFT JOIN customer_payments cp ON cp.id = pa.payment_id
    WHERE pa.sale_note_id = $1
    ORDER BY pa.created_at
  `, [noteId])
  return rows
}
