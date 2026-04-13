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
  quote_line_id?: string | null
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
  unitId?: string | null
  ruta?: string
  unidad?: string
  observaciones?: string
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
         (number, sale_id, state, concept, amount_untaxed, amount_tax, amount_total, amount_balance,
          unit_id, ruta, unidad, observaciones)
       VALUES ($1, $2, 'draft', $3, $4, $5, $6, $6, $7, $8, $9, $10)
       RETURNING *`,
      [number, data.saleId, data.concept ?? null, data.amountUntaxed, data.amountTax, data.amountTotal,
       data.unitId ?? null, data.ruta ?? null, data.unidad ?? null, data.observaciones ?? null]
    )
    const note: SaleNote = rows[0]

    if (data.lines && data.lines.length > 0) {
      for (let i = 0; i < data.lines.length; i++) {
        const line = data.lines[i]
        await client.query(
          `INSERT INTO sale_note_lines
             (sale_note_id, sequence, display_type, product_id, quote_line_id, name, qty,
              unit_price_mxn, subtotal, tax_amount, total)
           VALUES ($1, $2, 'product', $3, $4, $5, $6, $7, $8, $9, $10)`,
          [note.id, i + 1, line.product_id ?? null, line.quote_line_id ?? null, line.name, line.qty,
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

export async function updateSaleNoteFields(
  noteId: string,
  fields: { ruta?: string | null; unidad?: string | null; observaciones?: string | null }
): Promise<void> {
  const sets: string[] = []
  const values: (string | null)[] = []
  let i = 1
  if (fields.ruta !== undefined)          { sets.push(`ruta = $${i++}`);          values.push(fields.ruta) }
  if (fields.unidad !== undefined)        { sets.push(`unidad = $${i++}`);        values.push(fields.unidad) }
  if (fields.observaciones !== undefined) { sets.push(`observaciones = $${i++}`); values.push(fields.observaciones) }
  if (sets.length === 0) return
  values.push(noteId)
  await pool.query(
    `UPDATE sale_notes SET ${sets.join(', ')} WHERE id = $${i}`,
    values
  )
}

/**
 * Recalculate note paid/balance from confirmed payment applications.
 * Auto-mark as 'paid' if balance reaches 0.
 */
// ── Cobranza view ────────────────────────────────────────────────────────────

export interface CobranzaNote {
  id: string
  remision: string
  state: 'draft' | 'confirmed' | 'paid' | 'cancelled'
  concept: string | null
  amount_total: string
  amount_paid: string
  amount_balance: string
  fecha: string
  ruta: string | null
  unidad: string | null
  observaciones: string | null
  sale_id: string
  orden_servicio: string
  cliente: string
  agente: string | null
  abono1_fecha: string | null
  abono1_monto: string | null
  abono2_fecha: string | null
  abono2_monto: string | null
  abono3_fecha: string | null
  abono3_monto: string | null
  customer_id: string            // para multi-select cross-sale por cliente
  credit_disponible: string      // crédito del cliente pendiente de aplicar
}

export async function listAllNotesForCobranza(userId?: string): Promise<CobranzaNote[]> {
  const params: string[] = []
  const where = userId ? `WHERE s.user_id = $${params.push(userId)}` : ''

  const { rows } = await pool.query(`
    SELECT
      sn.id,
      sn.number        AS remision,
      sn.state,
      sn.concept,
      sn.amount_total,
      sn.amount_paid,
      sn.amount_balance,
      TO_CHAR(sn.created_at, 'YYYY-MM-DD') AS fecha,
      sn.ruta,
      sn.unidad,
      sn.observaciones,
      s.id             AS sale_id,
      s.number         AS orden_servicio,
      c.name           AS cliente,
      u.username       AS agente,
      c.id             AS customer_id,
      ab.p1_date       AS abono1_fecha,
      ab.p1_amount     AS abono1_monto,
      ab.p2_date       AS abono2_fecha,
      ab.p2_amount     AS abono2_monto,
      ab.p3_date       AS abono3_fecha,
      ab.p3_amount     AS abono3_monto,
      COALESCE(crd.credit, 0)::text AS credit_disponible
    FROM sale_notes sn
    JOIN sales     s  ON s.id = sn.sale_id
    JOIN contacts c  ON c.id = s.customer_id
    LEFT JOIN users u ON u.id = s.user_id
    LEFT JOIN LATERAL (
      SELECT
        MAX(CASE WHEN rn = 1 THEN payment_date::text END) AS p1_date,
        MAX(CASE WHEN rn = 1 THEN amount::text       END) AS p1_amount,
        MAX(CASE WHEN rn = 2 THEN payment_date::text END) AS p2_date,
        MAX(CASE WHEN rn = 2 THEN amount::text       END) AS p2_amount,
        MAX(CASE WHEN rn = 3 THEN payment_date::text END) AS p3_date,
        MAX(CASE WHEN rn = 3 THEN amount::text       END) AS p3_amount
      FROM (
        SELECT pa.amount, cp.payment_date,
               ROW_NUMBER() OVER (ORDER BY cp.payment_date ASC, pa.created_at ASC) AS rn
        FROM payment_applications pa
        JOIN customer_payments cp ON cp.id = pa.payment_id
        WHERE pa.sale_note_id = sn.id AND cp.state = 'confirmed'
        LIMIT 3
      ) sub
    ) ab ON true
    LEFT JOIN LATERAL (
      SELECT COALESCE(SUM(
        cp_c.amount - COALESCE(apl_c.applied, 0)
      ), 0)::numeric(14,2) AS credit
      FROM customer_payments cp_c
      LEFT JOIN (
        SELECT payment_id, SUM(amount) AS applied
        FROM payment_applications
        GROUP BY payment_id
      ) apl_c ON apl_c.payment_id = cp_c.id
      WHERE cp_c.customer_id = s.customer_id
        AND cp_c.state = 'confirmed'
        AND (cp_c.amount - COALESCE(apl_c.applied, 0)) > 0.005
    ) crd ON true
    ${where}
    ORDER BY sn.created_at DESC
  `, params)

  return rows
}

export async function updateSaleNoteTotals(noteId: string): Promise<void> {
  await pool.query(`
    UPDATE sale_notes
    SET amount_paid = COALESCE((
          SELECT SUM(pa.amount)
          FROM payment_applications pa
          JOIN customer_payments cp ON cp.id = pa.payment_id
          WHERE pa.sale_note_id = sale_notes.id AND cp.state = 'confirmed'
        ), 0),
        amount_balance = amount_total - COALESCE((
          SELECT SUM(pa.amount)
          FROM payment_applications pa
          JOIN customer_payments cp ON cp.id = pa.payment_id
          WHERE pa.sale_note_id = sale_notes.id AND cp.state = 'confirmed'
        ), 0)
    WHERE id = $1
  `, [noteId])

  await pool.query(`
    UPDATE sale_notes SET state = 'paid'
    WHERE id = $1 AND state = 'confirmed' AND amount_balance <= 0
  `, [noteId])
}
