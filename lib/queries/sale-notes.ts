import pool from '@/lib/db'

export interface SaleNote {
  id: string
  number: string
  sale_id: string
  state: 'draft' | 'confirmed' | 'cancelled' | 'paid'
  concept: string | null
  amount_untaxed: string
  amount_tax: string
  amount_total: string
  amount_paid: string
  amount_balance: string
  created_at: string
}

export interface SaleNoteLine {
  id: string
  sale_note_id: string
  sequence: number
  display_type: string | null
  product_id: string | null
  name: string
  qty: string | null
  unit_price_mxn: string
  subtotal: string
  tax_amount: string
  total: string
}

export async function listNotesBySale(saleId: string): Promise<SaleNote[]> {
  const { rows } = await pool.query(
    'SELECT * FROM sale_notes WHERE sale_id = $1 ORDER BY created_at',
    [saleId]
  )
  return rows
}

export async function getSaleNote(id: string): Promise<SaleNote | null> {
  const { rows } = await pool.query('SELECT * FROM sale_notes WHERE id = $1', [id])
  return rows[0] ?? null
}

export async function listNoteLines(noteId: string): Promise<SaleNoteLine[]> {
  const { rows } = await pool.query(
    'SELECT * FROM sale_note_lines WHERE sale_note_id = $1 ORDER BY sequence',
    [noteId]
  )
  return rows
}

export interface CreateSaleNoteLineInput {
  product_id?: string | null
  name: string
  qty: number
  unit_price_mxn: number
  subtotal: number
  tax_amount: number
  total: number
}

export async function createSaleNote(data: {
  saleId: string
  concept?: string
  amountUntaxed: number
  amountTax: number
  amountTotal: number
  lines?: CreateSaleNoteLineInput[]
}): Promise<SaleNote> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Generate NTA number
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const { rows: last } = await client.query(
      "SELECT number FROM sale_notes WHERE number LIKE $1 ORDER BY number DESC LIMIT 1",
      [`NTA-${dateStr}-%`]
    )
    let seq = 1
    if (last.length > 0) {
      const parts = last[0].number.split('-')
      seq = parseInt(parts[parts.length - 1], 10) + 1
    }
    const number = `NTA-${dateStr}-${String(seq).padStart(4, '0')}`

    const { rows } = await client.query(
      `INSERT INTO sale_notes
         (number, sale_id, state, concept, amount_untaxed, amount_tax, amount_total, amount_balance)
       VALUES ($1, $2, 'draft', $3, $4, $5, $6, $6)
       RETURNING *`,
      [number, data.saleId, data.concept ?? null, data.amountUntaxed, data.amountTax, data.amountTotal]
    )
    const note: SaleNote = rows[0]

    if (data.lines && data.lines.length > 0) {
      for (let i = 0; i < data.lines.length; i++) {
        const line = data.lines[i]
        await client.query(
          `INSERT INTO sale_note_lines
             (sale_note_id, sequence, display_type, product_id, name, qty,
              unit_price_mxn, subtotal, tax_amount, total)
           VALUES ($1, $2, 'product', $3, $4, $5, $6, $7, $8, $9)`,
          [note.id, i + 1, line.product_id ?? null, line.name, line.qty,
           line.unit_price_mxn, line.subtotal, line.tax_amount, line.total]
        )
      }
    }

    await client.query('COMMIT')
    return note
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function deleteSaleNote(noteId: string): Promise<void> {
  await pool.query('DELETE FROM sale_notes WHERE id = $1 AND state = $2', [noteId, 'draft'])
}

export async function updateSaleNoteState(id: string, state: string): Promise<void> {
  await pool.query('UPDATE sale_notes SET state = $1 WHERE id = $2', [state, id])
}

/**
 * Recalculate note paid/balance from confirmed payment applications.
 * Auto-mark as 'paid' if balance reaches 0.
 */
export async function updateSaleNoteTotals(noteId: string): Promise<void> {
  await pool.query(`
    UPDATE sale_notes
    SET amount_paid = COALESCE((
          SELECT SUM(pa.amount)
          FROM payment_applications pa
          JOIN payments p ON p.id = pa.payment_id
          WHERE pa.sale_note_id = sale_notes.id AND p.state = 'confirmed'
        ), 0),
        amount_balance = amount_total - COALESCE((
          SELECT SUM(pa.amount)
          FROM payment_applications pa
          JOIN payments p ON p.id = pa.payment_id
          WHERE pa.sale_note_id = sale_notes.id AND p.state = 'confirmed'
        ), 0)
    WHERE id = $1
  `, [noteId])

  await pool.query(`
    UPDATE sale_notes SET state = 'paid'
    WHERE id = $1 AND state = 'confirmed' AND amount_balance <= 0
  `, [noteId])
}
