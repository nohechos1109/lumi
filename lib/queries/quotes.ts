import pool from '@/lib/db'
import { listLines } from '@/lib/queries/quote_lines'

export type QuoteState = 'draft' | 'sent' | 'confirmed' | 'cancelled' | 'expired'

export interface Quote {
  id: string
  number: string
  state: QuoteState
  customer_id: string
  customer_name?: string
  executive_name?: string
  payment_term_id: string | null
  payment_term_name?: string
  quotation_date: string
  expiration_date: string | null
  fx_mxn_per_usd_snapshot: string
  description: string | null
  unit_count: number
  terms: string | null
  amount_untaxed: string
  amount_tax: string
  amount_total: string
  margin_amount: string
  margin_percent: string
  version: number
  user_id: string | null
  project_id: string | null
  project_name?: string
}

export async function listQuotesByUser(userId: string): Promise<Quote[]> {
  const { rows } = await pool.query(
    `SELECT q.*, c.name as customer_name, pt.name as payment_term_name, u.username as executive_name, p.name as project_name
     FROM quotes q
     LEFT JOIN customers c ON c.id = q.customer_id
     LEFT JOIN payment_terms pt ON pt.id = q.payment_term_id
     LEFT JOIN users u ON u.id = q.user_id
     LEFT JOIN projects p ON p.id = q.project_id
     WHERE q.user_id = $1
     ORDER BY q.quotation_date DESC`,
    [userId]
  )
  return rows
}

export async function listAllQuotes(): Promise<Quote[]> {
  const { rows } = await pool.query(
    `SELECT q.*, c.name as customer_name, pt.name as payment_term_name, u.username as executive_name, p.name as project_name
     FROM quotes q
     LEFT JOIN customers c ON c.id = q.customer_id
     LEFT JOIN payment_terms pt ON pt.id = q.payment_term_id
     LEFT JOIN users u ON u.id = q.user_id
     LEFT JOIN projects p ON p.id = q.project_id
     ORDER BY q.quotation_date DESC`
  )
  return rows
}

export async function listQuotesByProject(projectId: string): Promise<Quote[]> {
  const { rows } = await pool.query(
    `SELECT q.*, c.name as customer_name, pt.name as payment_term_name, u.username as executive_name, p.name as project_name
     FROM quotes q
     LEFT JOIN customers c ON c.id = q.customer_id
     LEFT JOIN payment_terms pt ON pt.id = q.payment_term_id
     LEFT JOIN users u ON u.id = q.user_id
     LEFT JOIN projects p ON p.id = q.project_id
     WHERE q.project_id = $1
     ORDER BY q.quotation_date DESC`,
    [projectId]
  )
  return rows
}

export async function getQuote(id: string): Promise<Quote | null> {
  const { rows } = await pool.query(
    `SELECT q.*, c.name as customer_name, pt.name as payment_term_name, u.username as executive_name, p.name as project_name
     FROM quotes q
     LEFT JOIN customers c ON c.id = q.customer_id
     LEFT JOIN payment_terms pt ON pt.id = q.payment_term_id
     LEFT JOIN users u ON u.id = q.user_id
     LEFT JOIN projects p ON p.id = q.project_id
     WHERE q.id = $1`,
    [id]
  )
  return rows[0] ?? null
}

export interface CreateQuoteInput {
  customer_id: string
  payment_term_id?: string
  quotation_date: string
  expiration_date?: string
  fx_mxn_per_usd_snapshot: number
  description?: string
  unit_count?: number
  terms?: string
  user_id: string
  project_id?: string
}

export async function createQuote(data: CreateQuoteInput): Promise<Quote> {
  // Generate quote number: COT-YYYYMMDD-XXXX
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const { rows: lastQuotes } = await pool.query(
    "SELECT number FROM quotes WHERE number LIKE $1 ORDER BY number DESC LIMIT 1",
    [`COT-${dateStr}-%`]
  )
  
  let nextSeq = 1
  if (lastQuotes.length > 0) {
    const lastNumber = lastQuotes[0].number
    const parts = lastNumber.split('-')
    nextSeq = parseInt(parts[parts.length - 1], 10) + 1
  }
  const number = `COT-${dateStr}-${String(nextSeq).padStart(4,'0')}`

  const { rows } = await pool.query(
    `INSERT INTO quotes
       (number, state, customer_id, payment_term_id, quotation_date, expiration_date,
        fx_mxn_per_usd_snapshot, description, unit_count, terms, user_id, project_id)
     VALUES ($1,'draft',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [number, data.customer_id, data.payment_term_id ?? null, data.quotation_date,
     data.expiration_date ?? null, data.fx_mxn_per_usd_snapshot,
     data.description ?? null, data.unit_count ?? 1,
     data.terms ?? null, data.user_id, data.project_id ?? null]
  )
  return rows[0]
}

export async function updateQuoteState(id: string, state: QuoteState): Promise<void> {
  await pool.query('UPDATE quotes SET state = $1 WHERE id = $2', [state, id])
}

export async function updateQuoteFields(id: string, data: { description?: string; unit_count?: number }): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description) }
  if (data.unit_count !== undefined) { fields.push(`unit_count = $${i++}`); values.push(data.unit_count) }
  if (!fields.length) return
  values.push(id)
  await pool.query(`UPDATE quotes SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteQuote(id: string): Promise<void> {
  await pool.query('DELETE FROM quote_lines WHERE quote_id = $1', [id])
  await pool.query('DELETE FROM quotes WHERE id = $1', [id])
}

export async function duplicateQuote(
  quoteId: string,
  userId: string,
  targetProjectId?: string | null
): Promise<Quote> {
  const original = await getQuote(quoteId)
  if (!original) throw new Error('Quote not found')
  const lines = await listLines(quoteId)
  const projectId = targetProjectId !== undefined ? targetProjectId : original.project_id

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Generate folio (same logic as createQuote)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const { rows: lastQuotes } = await client.query(
      "SELECT number FROM quotes WHERE number LIKE $1 ORDER BY number DESC LIMIT 1",
      [`COT-${dateStr}-%`]
    )
    let nextSeq = 1
    if (lastQuotes.length > 0) {
      const parts = lastQuotes[0].number.split('-')
      nextSeq = parseInt(parts[parts.length - 1], 10) + 1
    }
    const number = `COT-${dateStr}-${String(nextSeq).padStart(4, '0')}`

    // Insert new quote
    const { rows: [newQuote] } = await client.query(
      `INSERT INTO quotes
         (number, state, customer_id, payment_term_id, quotation_date, expiration_date,
          fx_mxn_per_usd_snapshot, description, unit_count, terms, user_id, project_id)
       VALUES ($1,'draft',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [number, original.customer_id, original.payment_term_id ?? null,
       new Date().toISOString().slice(0, 10), null,
       Number(original.fx_mxn_per_usd_snapshot),
       original.description ?? null, original.unit_count,
       original.terms ?? null, userId, projectId ?? null]
    )

    // Bulk insert all lines in one query
    if (lines.length > 0) {
      const valuePlaceholders = lines.map((_, i) => {
        const b = i * 19
        return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10},$${b+11},$${b+12},$${b+13},$${b+14},$${b+15},$${b+16},$${b+17},$${b+18},$${b+19})`
      }).join(',')
      const flatParams = lines.flatMap(line => [
        newQuote.id, line.sequence, line.display_type, line.product_id,
        line.name, line.qty, line.discount_percent, line.currency_snapshot,
        line.cost_base_snapshot, line.utility_fixed_snapshot,
        line.utility_factor_snapshot, line.fx_snapshot,
        line.unit_price_mxn_suggested, line.unit_price_mxn_manual,
        line.unit_price_mxn_effective, line.subtotal, line.tax_amount,
        line.total, line.margin_amount
      ])
      await client.query(
        `INSERT INTO quote_lines
           (quote_id, sequence, display_type, product_id, name, qty,
            discount_percent, currency_snapshot, cost_base_snapshot,
            utility_fixed_snapshot, utility_factor_snapshot, fx_snapshot,
            unit_price_mxn_suggested, unit_price_mxn_manual,
            unit_price_mxn_effective, subtotal, tax_amount, total, margin_amount)
         VALUES ${valuePlaceholders}`,
        flatParams
      )
    }

    // updateQuoteTotals inline (using client instead of pool)
    await client.query(`
      UPDATE quote_lines
      SET tax_amount = subtotal * 0.16,
          total = subtotal * 1.16,
          margin_amount = subtotal - (cost_base_snapshot * fx_snapshot * COALESCE(qty, 0))
      WHERE quote_id = $1 AND display_type = 'product'
    `, [newQuote.id])

    await client.query(`
      UPDATE quote_lines qld
      SET
        subtotal = -(SELECT COALESCE(SUM(subtotal),0) FROM quote_lines qlp WHERE qlp.quote_id = $1 AND qlp.display_type = 'product') * (qld.discount_percent / 100),
        tax_amount = -(SELECT COALESCE(SUM(tax_amount),0) FROM quote_lines qlp WHERE qlp.quote_id = $1 AND qlp.display_type = 'product') * (qld.discount_percent / 100),
        margin_amount = -(SELECT COALESCE(SUM(subtotal),0) FROM quote_lines qlp WHERE qlp.quote_id = $1 AND qlp.display_type = 'product') * (qld.discount_percent / 100)
      WHERE qld.quote_id = $1 AND qld.display_type = 'discount'
    `, [newQuote.id])

    await client.query(`
      UPDATE quote_lines SET total = subtotal + tax_amount
      WHERE quote_id = $1 AND display_type = 'discount'
    `, [newQuote.id])

    await client.query(`
      UPDATE quotes q SET
        amount_untaxed = COALESCE((SELECT SUM(subtotal) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product','discount')),0),
        amount_tax = COALESCE((SELECT SUM(tax_amount) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product','discount')),0),
        amount_total = COALESCE((SELECT SUM(total) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product','discount')),0),
        margin_amount = COALESCE((SELECT SUM(margin_amount) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product','discount')),0),
        margin_percent = CASE
          WHEN COALESCE((SELECT SUM(subtotal) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product','discount')),0) > 0
          THEN (COALESCE((SELECT SUM(margin_amount) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product','discount')),0) /
                COALESCE((SELECT SUM(subtotal) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product','discount')),0)) * 100
          ELSE 0
        END
      WHERE q.id = $1
    `, [newQuote.id])

    await client.query('COMMIT')
    return newQuote
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateQuoteTotals(id: string): Promise<void> {
  // 0. Enforce 16% IVA and margin calculation on all products
  await pool.query(`
    UPDATE quote_lines
    SET tax_amount = subtotal * 0.16,
        total = subtotal * 1.16,
        margin_amount = subtotal - (cost_base_snapshot * fx_snapshot * COALESCE(qty, 0))
    WHERE quote_id = $1 AND display_type = 'product'
  `, [id])

  // 1. Recalibrate any 'discount' lines based on the total of 'product' lines
  await pool.query(`
    UPDATE quote_lines qld
    SET 
      subtotal = - (
        SELECT COALESCE(SUM(subtotal), 0) FROM quote_lines qlp WHERE qlp.quote_id = $1 AND qlp.display_type = 'product'
      ) * (qld.discount_percent / 100),
      tax_amount = - (
        SELECT COALESCE(SUM(tax_amount), 0) FROM quote_lines qlp WHERE qlp.quote_id = $1 AND qlp.display_type = 'product'
      ) * (qld.discount_percent / 100),
      margin_amount = - (
        SELECT COALESCE(SUM(subtotal), 0) FROM quote_lines qlp WHERE qlp.quote_id = $1 AND qlp.display_type = 'product'
      ) * (qld.discount_percent / 100)
    WHERE qld.quote_id = $1 AND qld.display_type = 'discount'
  `, [id])

  await pool.query(`
    UPDATE quote_lines
    SET total = subtotal + tax_amount
    WHERE quote_id = $1 AND display_type = 'discount'
  `, [id])

  // 2. Recompute totals from ALL lines (products + discounts)
  await pool.query(`
    UPDATE quotes q SET
      amount_untaxed = COALESCE((SELECT SUM(subtotal) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product', 'discount')), 0),
      amount_tax     = COALESCE((SELECT SUM(tax_amount) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product', 'discount')), 0),
      amount_total   = COALESCE((SELECT SUM(total) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product', 'discount')), 0),
      margin_amount  = COALESCE((SELECT SUM(margin_amount) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product', 'discount')), 0),
      margin_percent = CASE 
        WHEN COALESCE((SELECT SUM(subtotal) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product', 'discount')), 0) > 0 
        THEN (COALESCE((SELECT SUM(margin_amount) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product', 'discount')), 0) / 
              COALESCE((SELECT SUM(subtotal) FROM quote_lines WHERE quote_id = q.id AND display_type IN ('product', 'discount')), 0)) * 100
        ELSE 0 
      END
    WHERE q.id = $1
  `, [id])
}
