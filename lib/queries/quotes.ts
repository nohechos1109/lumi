import pool from '@/lib/db'
import type { PoolClient } from 'pg'
import { listLines } from '@/lib/queries/quote_lines'
import { getSettings } from '@/lib/queries/settings'

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
  installation_notes: string | null
  archived_at: string | null
}

export async function listQuotesByUser(userId: string): Promise<Quote[]> {
  const { rows } = await pool.query(
    `SELECT q.*, c.name as customer_name, pt.name as payment_term_name, u.username as executive_name, p.name as project_name
     FROM quotes q
     LEFT JOIN contacts c ON c.id = q.customer_id
     LEFT JOIN payment_terms pt ON pt.id = q.payment_term_id
     LEFT JOIN users u ON u.id = q.user_id
     LEFT JOIN projects p ON p.id = q.project_id
     WHERE q.user_id = $1
     ORDER BY q.quotation_date DESC`,
    [userId]
  )
  return rows
}

export async function listProjectQuotesByUser(userId: string): Promise<Quote[]> {
  const { rows } = await pool.query(
    `SELECT q.*, c.name as customer_name, pt.name as payment_term_name, u.username as executive_name, p.name as project_name
     FROM quotes q
     LEFT JOIN contacts c ON c.id = q.customer_id
     LEFT JOIN payment_terms pt ON pt.id = q.payment_term_id
     LEFT JOIN users u ON u.id = q.user_id
     LEFT JOIN projects p ON p.id = q.project_id
     WHERE q.user_id = $1 AND q.project_id IS NOT NULL
     ORDER BY q.quotation_date DESC`,
    [userId]
  )
  return rows
}

export async function listAllQuotes(): Promise<Quote[]> {
  const { rows } = await pool.query(
    `SELECT q.*, c.name as customer_name, pt.name as payment_term_name, u.username as executive_name, p.name as project_name
     FROM quotes q
     LEFT JOIN contacts c ON c.id = q.customer_id
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
     LEFT JOIN contacts c ON c.id = q.customer_id
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
     LEFT JOIN contacts c ON c.id = q.customer_id
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
        description, unit_count, terms, user_id, project_id)
     VALUES ($1,'draft',$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [number, data.customer_id, data.payment_term_id ?? null, data.quotation_date,
     data.expiration_date ?? null,
     data.description ?? null, data.unit_count ?? 1,
     data.terms ?? null, data.user_id, data.project_id ?? null]
  )
  return rows[0]
}

export async function updateQuoteState(id: string, state: QuoteState): Promise<void> {
  await pool.query('UPDATE quotes SET state = $1 WHERE id = $2', [state, id])
}

export async function updateQuoteFields(id: string, data: { description?: string; unit_count?: number; installation_notes?: string | null }): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  if (data.description !== undefined) { fields.push(`description = $${i++}`); values.push(data.description) }
  if (data.unit_count !== undefined) { fields.push(`unit_count = $${i++}`); values.push(data.unit_count) }
  if (data.installation_notes !== undefined) { fields.push(`installation_notes = $${i++}`); values.push(data.installation_notes) }
  if (!fields.length) return
  values.push(id)
  await pool.query(`UPDATE quotes SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteQuote(id: string): Promise<void> {
  await pool.query('DELETE FROM quote_lines WHERE quote_id = $1', [id])
  await pool.query('DELETE FROM quotes WHERE id = $1', [id])
}

export interface QuoteDependencies {
  sales: number
  sale_amount_total: number
  payments: number
  renewed_children: number
  total_hard: number
}

export async function getQuoteDependencies(id: string): Promise<QuoteDependencies> {
  const hasPayments = (await pool.query(`SELECT to_regclass('public.payments') AS t`)).rows[0].t !== null
  const hasSales    = (await pool.query(`SELECT to_regclass('public.sales')    AS t`)).rows[0].t !== null

  const salesQuery = hasSales
    ? `(SELECT COUNT(*)::int FROM sales WHERE quote_id = $1)`
    : `0::int`
  const saleAmountQuery = hasSales
    ? `COALESCE((SELECT SUM(amount_total) FROM sales WHERE quote_id = $1), 0)::float`
    : `0::float`
  const paymentsQuery = hasPayments && hasSales
    ? `(SELECT COUNT(*)::int FROM payments p JOIN sales s ON s.id = p.sale_id WHERE s.quote_id = $1)`
    : `0::int`

  const { rows } = await pool.query(
    `SELECT
       ${salesQuery}      AS sales,
       ${saleAmountQuery} AS sale_amount_total,
       ${paymentsQuery}   AS payments,
       (SELECT COUNT(*)::int FROM quotes WHERE renewed_from_id = $1) AS renewed_children`,
    [id]
  )
  const r = rows[0]
  // total_hard = registros que se perderán en un borrado en cascada.
  // renewed_children no cuenta: FK SET NULL conserva los hijos.
  const total_hard = r.sales + r.payments
  return { ...r, total_hard }
}

// Borra la cotización y TODO su historial financiero (ventas, pagos, notas).
// Orden obligatorio por FKs sin CASCADE desde sales/sale_notes:
//   1. payment_applications (FK a sale_notes sin CASCADE)
//   2. payments (FK a sales sin CASCADE)
//   3. sales (CASCADE a sale_notes → sale_note_lines, psi, sale_anticipos)
//   4. quote_lines (CASCADE desde quotes en schema nuevo, pero explícito por compat)
//   5. quotes (CASCADE a discount_approvals)
export async function deleteQuoteCascade(id: string): Promise<void> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const hasPaymentApps = (await client.query(`SELECT to_regclass('public.payment_applications') AS t`)).rows[0].t !== null
    const hasPayments    = (await client.query(`SELECT to_regclass('public.payments')             AS t`)).rows[0].t !== null
    const hasSales       = (await client.query(`SELECT to_regclass('public.sales')                AS t`)).rows[0].t !== null

    if (hasPaymentApps) {
      await client.query(
        `DELETE FROM payment_applications
         WHERE sale_note_id IN (
           SELECT sn.id FROM sale_notes sn
           JOIN sales s ON s.id = sn.sale_id
           WHERE s.quote_id = $1
         )`,
        [id]
      )
    }
    if (hasPayments) {
      await client.query('DELETE FROM payments WHERE sale_id IN (SELECT id FROM sales WHERE quote_id = $1)', [id])
    }
    if (hasSales) {
      await client.query('DELETE FROM sales WHERE quote_id = $1', [id])
    }
    await client.query('DELETE FROM quote_lines WHERE quote_id = $1', [id])
    await client.query('DELETE FROM quotes WHERE id = $1', [id])
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function duplicateQuote(
  quoteId: string,
  userId: string,
  targetProjectId?: string | null,
  targetCustomerId?: string | null
): Promise<Quote> {
  const original = await getQuote(quoteId)
  if (!original) throw new Error('Quote not found')
  const lines = await listLines(quoteId)
  const projectId = targetProjectId !== undefined ? targetProjectId : original.project_id
  const customerId = targetCustomerId !== undefined ? targetCustomerId : original.customer_id

  // Fetch current FX rate and product prices before opening the transaction
  const settings = await getSettings()
  const currentFx = Number(settings?.fx_mxn_per_usd ?? 17.85)

  // Batch-fetch current product data for all product lines
  const linesToCopy = lines.filter(line => line.display_type !== 'discount')
  const productIds = linesToCopy
    .filter(l => l.product_id && l.display_type === 'product')
    .map(l => l.product_id as string)

  const productMap = new Map<string, { cost_base: string; utility_fixed: string; utility_factor: string; currency: string }>()
  if (productIds.length > 0) {
    const { rows: currentProducts } = await pool.query(
      `SELECT id, cost_base, utility_fixed, utility_factor, currency FROM products WHERE id = ANY($1)`,
      [productIds]
    )
    for (const p of currentProducts) productMap.set(p.id, p)
  }

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
          description, unit_count, terms, user_id, project_id)
       VALUES ($1,'draft',$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [number, customerId, original.payment_term_id ?? null,
       new Date().toISOString().slice(0, 10), null,
       original.description ?? null, original.unit_count,
       original.terms ?? null, userId, projectId ?? null]
    )

    // Bulk insert lines with recalculated prices from current catalog
    if (linesToCopy.length > 0) {
      const valuePlaceholders = linesToCopy.map((_, i) => {
        const b = i * 19
        return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10},$${b+11},$${b+12},$${b+13},$${b+14},$${b+15},$${b+16},$${b+17},$${b+18},$${b+19})`
      }).join(',')
      const flatParams = linesToCopy.flatMap(line => {
        // For product lines: recalculate from current catalog prices
        if (line.display_type === 'product' && line.product_id && productMap.has(line.product_id)) {
          const p = productMap.get(line.product_id)!
          const costBase = Number(p.cost_base)
          const utilityFixed = Number(p.utility_fixed)
          const utilityFactor = Number(p.utility_factor)
          const fx = p.currency === 'USD' ? currentFx : 1
          const qty = Number(line.qty ?? 1)
          const suggested = (costBase * utilityFactor + utilityFixed) * fx
          const subtotal = suggested * qty  // discount_percent = 0
          const taxAmount = subtotal * 0.16
          const total = subtotal * 1.16
          const marginAmount = subtotal - (costBase * fx * qty)
          return [
            newQuote.id, line.sequence, line.display_type, line.product_id,
            line.name, line.qty, 0, p.currency,
            costBase, utilityFixed, utilityFactor, fx,
            suggested, null, suggested,
            subtotal, taxAmount, total, marginAmount
          ]
        }
        // For non-product lines (sections, notes) or deleted products: copy as-is
        return [
          newQuote.id, line.sequence, line.display_type, line.product_id,
          line.name, line.qty, 0, line.currency_snapshot,
          line.cost_base_snapshot, line.utility_fixed_snapshot,
          line.utility_factor_snapshot, line.fx_snapshot,
          line.unit_price_mxn_suggested, line.unit_price_mxn_manual,
          line.unit_price_mxn_effective, line.subtotal, line.tax_amount,
          line.total, line.margin_amount
        ]
      })
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

export async function updateQuoteTotals(id: string, client?: PoolClient): Promise<void> {
  const q = client ?? pool
  // 0. Enforce 16% IVA and margin calculation on all products
  await q.query(`
    UPDATE quote_lines
    SET tax_amount = subtotal * 0.16,
        total = subtotal * 1.16,
        margin_amount = subtotal - (cost_base_snapshot * fx_snapshot * COALESCE(qty, 0))
    WHERE quote_id = $1 AND display_type = 'product'
  `, [id])

  // 1. Recalibrate any 'discount' lines based on the total of 'product' lines
  // Only recalibrate approved discount lines (exclude pending ones)
  await q.query(`
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
    WHERE qld.quote_id = $1 AND qld.display_type = 'discount' AND COALESCE(qld.discount_approval_status, 'approved') != 'pending'
  `, [id])

  await q.query(`
    UPDATE quote_lines
    SET total = subtotal + tax_amount
    WHERE quote_id = $1 AND display_type = 'discount' AND COALESCE(discount_approval_status, 'approved') != 'pending'
  `, [id])

  // 2. Recompute totals from ALL lines (products + approved discounts only)
  await q.query(`
    UPDATE quotes q SET
      amount_untaxed = COALESCE((SELECT SUM(subtotal) FROM quote_lines WHERE quote_id = q.id AND (display_type = 'product' OR (display_type = 'discount' AND COALESCE(discount_approval_status, 'approved') != 'pending'))), 0),
      amount_tax     = COALESCE((SELECT SUM(tax_amount) FROM quote_lines WHERE quote_id = q.id AND (display_type = 'product' OR (display_type = 'discount' AND COALESCE(discount_approval_status, 'approved') != 'pending'))), 0),
      amount_total   = COALESCE((SELECT SUM(total) FROM quote_lines WHERE quote_id = q.id AND (display_type = 'product' OR (display_type = 'discount' AND COALESCE(discount_approval_status, 'approved') != 'pending'))), 0),
      margin_amount  = COALESCE((SELECT SUM(margin_amount) FROM quote_lines WHERE quote_id = q.id AND (display_type = 'product' OR (display_type = 'discount' AND COALESCE(discount_approval_status, 'approved') != 'pending'))), 0),
      margin_percent = CASE
        WHEN COALESCE((SELECT SUM(subtotal) FROM quote_lines WHERE quote_id = q.id AND (display_type = 'product' OR (display_type = 'discount' AND COALESCE(discount_approval_status, 'approved') != 'pending'))), 0) > 0
        THEN (COALESCE((SELECT SUM(margin_amount) FROM quote_lines WHERE quote_id = q.id AND (display_type = 'product' OR (display_type = 'discount' AND COALESCE(discount_approval_status, 'approved') != 'pending'))), 0) /
              COALESCE((SELECT SUM(subtotal) FROM quote_lines WHERE quote_id = q.id AND (display_type = 'product' OR (display_type = 'discount' AND COALESCE(discount_approval_status, 'approved') != 'pending'))), 0)) * 100
        ELSE 0
      END
    WHERE q.id = $1
  `, [id])
}

export async function archiveQuote(id: string): Promise<void> {
  await pool.query('UPDATE quotes SET archived_at = NOW() WHERE id = $1', [id])
}

export async function unarchiveQuote(id: string): Promise<void> {
  await pool.query('UPDATE quotes SET archived_at = NULL WHERE id = $1', [id])
}
