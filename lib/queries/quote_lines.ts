import pool from '@/lib/db'
import type { PoolClient } from 'pg'

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
  discount_approval_status?: string | null
  pending_discount_percent?: string | null
  pending_approval_id?: string | null
  sku?: string
}

export async function listLines(quoteId: string): Promise<QuoteLine[]> {
  const { rows } = await pool.query(
    `SELECT ql.*, p.sku as sku,
            da.discount_percent as pending_discount_percent,
            da.id as pending_approval_id
     FROM quote_lines ql
     LEFT JOIN products p ON p.id = ql.product_id
     LEFT JOIN discount_approvals da
            ON da.quote_line_id = ql.id AND da.status = 'pending'
     WHERE ql.quote_id = $1
     ORDER BY
       CASE WHEN ql.display_type = 'discount' THEN 1 ELSE 0 END ASC,
       ql.sequence ASC`,
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
  const costPerUnit = (data.cost_base_snapshot ?? 0) * (data.fx_snapshot ?? 1)
  const marginAmount = subtotal - (costPerUnit * qty)

  const { rows } = await pool.query(
    `INSERT INTO quote_lines
       (quote_id, sequence, display_type, product_id, name, qty, discount_percent,
        currency_snapshot, cost_base_snapshot, utility_fixed_snapshot, utility_factor_snapshot,
        fx_snapshot, unit_price_mxn_suggested, unit_price_mxn_manual, unit_price_mxn_effective,
        subtotal, tax_amount, total, margin_amount)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,0,$16,$17)
     RETURNING *`,
    [data.quote_id, sequence, data.display_type, data.product_id ?? null, data.name,
     qty, discount,
     data.currency_snapshot ?? null, data.cost_base_snapshot ?? 0,
     data.utility_fixed_snapshot ?? 0, data.utility_factor_snapshot ?? 1,
     data.fx_snapshot ?? 1, data.unit_price_mxn_suggested ?? 0,
     data.unit_price_mxn_manual ?? null, effective, subtotal, marginAmount]
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

export type StalenessReason = 'product' | 'fx' | 'both' | 'product_deleted'

export interface QuoteLineStaleness {
  line_id: string
  reason: StalenessReason
  has_manual: boolean
  new_cost_base: number | null
  new_utility_fixed: number | null
  new_utility_factor: number | null
  new_currency: 'MXN' | 'USD' | null
  new_fx: number | null
  new_suggested: number | null
  old_suggested: number
  old_fx: number
  old_currency: string | null
}

const STALENESS_EPS = 0.005

function snapsDiffer(a: number, b: number): boolean {
  return Math.abs(a - b) > STALENESS_EPS
}

export async function listLineStaleness(quoteId: string): Promise<QuoteLineStaleness[]> {
  const { rows } = await pool.query(
    `WITH gs AS (SELECT fx_mxn_per_usd FROM global_settings LIMIT 1)
     SELECT
       ql.id,
       ql.unit_price_mxn_suggested,
       ql.unit_price_mxn_manual,
       ql.cost_base_snapshot,
       ql.utility_fixed_snapshot,
       ql.utility_factor_snapshot,
       ql.fx_snapshot,
       ql.currency_snapshot,
       p.id AS product_exists,
       p.cost_base       AS p_cost_base,
       p.utility_fixed   AS p_utility_fixed,
       p.utility_factor  AS p_utility_factor,
       p.currency        AS p_currency,
       CASE WHEN p.currency = 'USD' THEN gs.fx_mxn_per_usd ELSE 1 END AS new_fx
     FROM quote_lines ql
     LEFT JOIN products p ON p.id = ql.product_id
     CROSS JOIN gs
     WHERE ql.quote_id = $1
       AND ql.display_type = 'product'
       AND ql.product_id IS NOT NULL`,
    [quoteId]
  )

  const out: QuoteLineStaleness[] = []
  for (const r of rows) {
    const oldSuggested = Number(r.unit_price_mxn_suggested)
    const oldFx = Number(r.fx_snapshot)
    const oldCurrency: string | null = r.currency_snapshot
    const hasManual = r.unit_price_mxn_manual !== null

    if (!r.product_exists) {
      out.push({
        line_id: r.id,
        reason: 'product_deleted',
        has_manual: hasManual,
        new_cost_base: null,
        new_utility_fixed: null,
        new_utility_factor: null,
        new_currency: null,
        new_fx: null,
        new_suggested: null,
        old_suggested: oldSuggested,
        old_fx: oldFx,
        old_currency: oldCurrency,
      })
      continue
    }

    const newCostBase = Number(r.p_cost_base)
    const newUtilityFixed = Number(r.p_utility_fixed)
    const newUtilityFactor = Number(r.p_utility_factor)
    const newCurrency = r.p_currency as 'MXN' | 'USD'
    const newFx = Number(r.new_fx)

    const productChanged =
      snapsDiffer(newCostBase, Number(r.cost_base_snapshot)) ||
      snapsDiffer(newUtilityFixed, Number(r.utility_fixed_snapshot)) ||
      snapsDiffer(newUtilityFactor, Number(r.utility_factor_snapshot)) ||
      (oldCurrency ?? '').trim() !== newCurrency
    const fxChanged = snapsDiffer(newFx, oldFx)

    if (!productChanged && !fxChanged) continue

    const newSuggested = (newCostBase * newUtilityFactor + newUtilityFixed) * newFx
    const reason: StalenessReason = productChanged && fxChanged ? 'both' : productChanged ? 'product' : 'fx'

    out.push({
      line_id: r.id,
      reason,
      has_manual: hasManual,
      new_cost_base: newCostBase,
      new_utility_fixed: newUtilityFixed,
      new_utility_factor: newUtilityFactor,
      new_currency: newCurrency,
      new_fx: newFx,
      new_suggested: newSuggested,
      old_suggested: oldSuggested,
      old_fx: oldFx,
      old_currency: oldCurrency,
    })
  }
  return out
}

export interface RefreshLinesInput {
  line_ids?: string[]
  all?: boolean
  mode?: 'preserve_manual' | 'use_suggested'
}

export interface RefreshLinesResult {
  refreshed: number
  skipped: Array<{ line_id: string; reason: 'product_deleted' | 'not_stale' }>
}

async function fetchLineCurrentData(
  quoteId: string,
  lineIds: string[],
): Promise<QuoteLineStaleness[]> {
  if (lineIds.length === 0) return []
  const { rows } = await pool.query(
    `WITH gs AS (SELECT fx_mxn_per_usd FROM global_settings LIMIT 1)
     SELECT
       ql.id,
       ql.unit_price_mxn_suggested,
       ql.unit_price_mxn_manual,
       ql.cost_base_snapshot,
       ql.utility_fixed_snapshot,
       ql.utility_factor_snapshot,
       ql.fx_snapshot,
       ql.currency_snapshot,
       p.id AS product_exists,
       p.cost_base       AS p_cost_base,
       p.utility_fixed   AS p_utility_fixed,
       p.utility_factor  AS p_utility_factor,
       p.currency        AS p_currency,
       CASE WHEN p.currency = 'USD' THEN gs.fx_mxn_per_usd ELSE 1 END AS new_fx
     FROM quote_lines ql
     LEFT JOIN products p ON p.id = ql.product_id
     CROSS JOIN gs
     WHERE ql.quote_id = $1
       AND ql.id = ANY($2)
       AND ql.display_type = 'product'
       AND ql.product_id IS NOT NULL`,
    [quoteId, lineIds],
  )

  const out: QuoteLineStaleness[] = []
  for (const r of rows) {
    const oldSuggested = Number(r.unit_price_mxn_suggested)
    const oldFx = Number(r.fx_snapshot)
    const oldCurrency: string | null = r.currency_snapshot
    const hasManual = r.unit_price_mxn_manual !== null

    if (!r.product_exists) {
      out.push({
        line_id: r.id,
        reason: 'product_deleted',
        has_manual: hasManual,
        new_cost_base: null,
        new_utility_fixed: null,
        new_utility_factor: null,
        new_currency: null,
        new_fx: null,
        new_suggested: null,
        old_suggested: oldSuggested,
        old_fx: oldFx,
        old_currency: oldCurrency,
      })
      continue
    }

    const newCostBase = Number(r.p_cost_base)
    const newUtilityFixed = Number(r.p_utility_fixed)
    const newUtilityFactor = Number(r.p_utility_factor)
    const newCurrency = r.p_currency as 'MXN' | 'USD'
    const newFx = Number(r.new_fx)

    const productChanged =
      snapsDiffer(newCostBase, Number(r.cost_base_snapshot)) ||
      snapsDiffer(newUtilityFixed, Number(r.utility_fixed_snapshot)) ||
      snapsDiffer(newUtilityFactor, Number(r.utility_factor_snapshot)) ||
      (oldCurrency ?? '').trim() !== newCurrency
    const fxChanged = snapsDiffer(newFx, oldFx)

    const newSuggested = (newCostBase * newUtilityFactor + newUtilityFixed) * newFx
    let reason: StalenessReason
    if (productChanged && fxChanged) reason = 'both'
    else if (productChanged) reason = 'product'
    else if (fxChanged) reason = 'fx'
    else reason = 'fx' // placeholder; caller filters or ignores

    out.push({
      line_id: r.id,
      reason,
      has_manual: hasManual,
      new_cost_base: newCostBase,
      new_utility_fixed: newUtilityFixed,
      new_utility_factor: newUtilityFactor,
      new_currency: newCurrency,
      new_fx: newFx,
      new_suggested: newSuggested,
      old_suggested: oldSuggested,
      old_fx: oldFx,
      old_currency: oldCurrency,
    })
  }
  return out
}

export async function refreshQuoteLines(
  quoteId: string,
  input: RefreshLinesInput,
  runTotals: (quoteId: string, client: PoolClient) => Promise<void>,
): Promise<RefreshLinesResult> {
  const mode = input.mode ?? 'preserve_manual'
  const stale = await listLineStaleness(quoteId)

  let targets: QuoteLineStaleness[]
  if (input.all) {
    targets = stale
  } else {
    const ids = new Set(input.line_ids ?? [])
    const staleTargets = stale.filter(s => ids.has(s.line_id))
    if (mode === 'use_suggested') {
      // Include non-stale lines so the user can always opt to clear manual price
      // and adopt the current suggested.
      const missingIds = [...ids].filter(id => !staleTargets.some(t => t.line_id === id))
      const extra = missingIds.length > 0 ? await fetchLineCurrentData(quoteId, missingIds) : []
      targets = [...staleTargets, ...extra]
    } else {
      targets = staleTargets
    }
  }

  const skipped: RefreshLinesResult['skipped'] = []
  const updatable = targets.filter(t => {
    if (t.reason === 'product_deleted') {
      skipped.push({ line_id: t.line_id, reason: 'product_deleted' })
      return false
    }
    return true
  })

  if (updatable.length === 0) {
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await runTotals(quoteId, client)
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
    return { refreshed: 0, skipped }
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const t of updatable) {
      await client.query(
        `UPDATE quote_lines SET
           cost_base_snapshot       = $1,
           utility_fixed_snapshot   = $2,
           utility_factor_snapshot  = $3,
           currency_snapshot        = $4,
           fx_snapshot              = $5,
           unit_price_mxn_suggested = $6,
           unit_price_mxn_manual    = CASE WHEN $7::text = 'use_suggested' THEN NULL ELSE unit_price_mxn_manual END,
           unit_price_mxn_effective = CASE
             WHEN $7::text = 'use_suggested' THEN $6
             WHEN unit_price_mxn_manual IS NOT NULL THEN unit_price_mxn_effective
             ELSE $6
           END,
           subtotal = CASE
             WHEN $7::text = 'use_suggested' OR unit_price_mxn_manual IS NULL
               THEN $6 * COALESCE(qty, 1) * (1 - discount_percent / 100)
             ELSE unit_price_mxn_effective * COALESCE(qty, 1) * (1 - discount_percent / 100)
           END
         WHERE id = $8 AND quote_id = $9`,
        [
          t.new_cost_base,
          t.new_utility_fixed,
          t.new_utility_factor,
          t.new_currency,
          t.new_fx,
          t.new_suggested,
          mode,
          t.line_id,
          quoteId,
        ]
      )
    }
    await runTotals(quoteId, client)
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  return { refreshed: updatable.length, skipped }
}
