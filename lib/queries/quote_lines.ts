import pool from '@/lib/db'

export interface QuoteLine {
  id: string
  quote_id: string
  sequence: number
  display_type: 'product' | 'section' | 'note' | 'discount' | null
  product_id: string | null
  name: string
  qty: string | null
  discount_percent: string
  currency_snapshot: string | null
  cost_base_snapshot: string
  utility_fixed_snapshot: string
  utility_factor_snapshot: string
  fx_snapshot: string
  unit_price_mxn_suggested: string
  unit_price_mxn_manual: string | null
  unit_price_mxn_effective: string
  subtotal: string
  tax_amount: string
  total: string
  margin_amount: string
}

export async function listLines(quoteId: string): Promise<QuoteLine[]> {
  const { rows } = await pool.query(
    `SELECT ql.*
     FROM quote_lines ql
     WHERE ql.quote_id = $1
     ORDER BY ql.sequence`,
    [quoteId]
  )
  return rows
}

export interface CreateLineInput {
  quote_id: string
  display_type: 'product' | 'section' | 'note' | 'discount'
  product_id?: string
  name: string
  qty?: number
  discount_percent?: number
  currency_snapshot?: string
  cost_base_snapshot?: number
  utility_fixed_snapshot?: number
  utility_factor_snapshot?: number
  fx_snapshot?: number
  unit_price_mxn_suggested?: number
  unit_price_mxn_manual?: number
}

export async function createLine(data: CreateLineInput): Promise<QuoteLine> {
  // Get next sequence
  const { rows: [{ max }] } = await pool.query(
    'SELECT COALESCE(MAX(sequence),0) as max FROM quote_lines WHERE quote_id = $1',
    [data.quote_id]
  )
  const sequence = Number(max) + 1

  const effective = data.unit_price_mxn_manual ?? data.unit_price_mxn_suggested ?? 0
  const qty = data.qty ?? 1
  const discount = data.discount_percent ?? 0
  const subtotal = Number(effective) * qty * (1 - discount / 100)

  const { rows } = await pool.query(
    `INSERT INTO quote_lines
       (quote_id, sequence, display_type, product_id, name, qty, discount_percent,
        currency_snapshot, cost_base_snapshot, utility_fixed_snapshot, utility_factor_snapshot,
        fx_snapshot, unit_price_mxn_suggested, unit_price_mxn_manual, unit_price_mxn_effective,
        subtotal, tax_amount, total, margin_amount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,0,$16,0)
     RETURNING *`,
    [data.quote_id, sequence, data.display_type, data.product_id ?? null, data.name,
     qty, discount,
     data.currency_snapshot ?? null, data.cost_base_snapshot ?? 0,
     data.utility_fixed_snapshot ?? 0, data.utility_factor_snapshot ?? 1,
     data.fx_snapshot ?? 1, data.unit_price_mxn_suggested ?? 0,
     data.unit_price_mxn_manual ?? null, effective, subtotal]
  )
  return rows[0]
}

export async function updateLine(id: string, data: Partial<CreateLineInput> & { unit_price_mxn_manual?: number | null }): Promise<void> {
  // First, get the current line so we can recalculate
  const { rows: [current] } = await pool.query('SELECT * FROM quote_lines WHERE id = $1', [id])
  if (!current) return

  const qty = data.qty !== undefined ? Number(data.qty) : Number(current.qty ?? 1)
  const discount = data.discount_percent !== undefined ? Number(data.discount_percent) : Number(current.discount_percent)
  
  let effective = Number(current.unit_price_mxn_effective)
  if (data.unit_price_mxn_manual !== undefined) {
    effective = data.unit_price_mxn_manual !== null
      ? Number(data.unit_price_mxn_manual)
      : Number(current.unit_price_mxn_suggested)
  }

  const subtotal = effective * qty * (1 - discount / 100)

  // Recalculate margin: subtotal - (cost_base_snapshot * fx_snapshot * qty)
  const costPerUnit = Number(current.cost_base_snapshot) * Number(current.fx_snapshot)
  const marginAmount = subtotal - (costPerUnit * qty)

  // Tax will be re-enforced globally by updateQuoteTotals, but we reset it to 0 initially here
  let taxAmount = 0

  await pool.query(
    `UPDATE quote_lines SET
       qty = $1, discount_percent = $2,
       unit_price_mxn_manual = $3, unit_price_mxn_effective = $4,
       subtotal = $5, tax_amount = $6, total = $7, margin_amount = $8,
       name = COALESCE($9, name)
     WHERE id = $10`,
    [qty, discount,
     data.unit_price_mxn_manual ?? current.unit_price_mxn_manual,
     effective, subtotal, taxAmount, subtotal + taxAmount, marginAmount,
     data.name ?? null, id]
  )
}


export async function deleteLine(id: string): Promise<void> {
  await pool.query('DELETE FROM quote_lines WHERE id = $1', [id])
}
