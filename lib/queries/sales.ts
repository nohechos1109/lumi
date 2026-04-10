import pool from '@/lib/db'

export interface Sale {
  id: string
  number: string
  quote_id: string
  customer_id: string
  project_id: string | null
  user_id: string | null
  state: 'active' | 'paid' | 'cancelled'
  amount_untaxed: string
  amount_tax: string
  amount_total: string
  amount_paid: string
  amount_balance: string
  unit_count: number
  created_at: string
  archived_at: string | null
  // joined
  customer_name?: string
  project_name?: string
  quote_number?: string
  executive_name?: string
}

const SALE_SELECT = `
  SELECT s.*,
         c.name   AS customer_name,
         p.name   AS project_name,
         q.number AS quote_number,
         u.username AS executive_name
  FROM sales s
  LEFT JOIN customers c ON c.id = s.customer_id
  LEFT JOIN projects  p ON p.id = s.project_id
  LEFT JOIN quotes    q ON q.id = s.quote_id
  LEFT JOIN users     u ON u.id = s.user_id
`

export async function listAllSales(): Promise<Sale[]> {
  const { rows } = await pool.query(`${SALE_SELECT} ORDER BY s.created_at DESC`)
  return rows
}

export async function listSalesByUser(userId: string): Promise<Sale[]> {
  const { rows } = await pool.query(
    `${SALE_SELECT} WHERE s.user_id = $1 ORDER BY s.created_at DESC`,
    [userId]
  )
  return rows
}

export async function listSalesByProject(projectId: string): Promise<Sale[]> {
  const { rows } = await pool.query(
    `${SALE_SELECT} WHERE s.project_id = $1 ORDER BY s.created_at DESC`,
    [projectId]
  )
  return rows
}

export async function getSale(id: string): Promise<Sale | null> {
  const { rows } = await pool.query(`${SALE_SELECT} WHERE s.id = $1`, [id])
  return rows[0] ?? null
}

export async function getSaleByQuote(quoteId: string): Promise<Sale | null> {
  const { rows } = await pool.query(`${SALE_SELECT} WHERE s.quote_id = $1`, [quoteId])
  return rows[0] ?? null
}

/** Generate sequential number: VTA-YYYYMMDD-XXXX */
async function generateNumber(prefix: string, table: string, client: import('pg').PoolClient): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const pattern = `${prefix}-${dateStr}-%`
  const { rows } = await client.query(
    `SELECT number FROM ${table} WHERE number LIKE $1 ORDER BY number DESC LIMIT 1`,
    [pattern]
  )
  let seq = 1
  if (rows.length > 0) {
    const parts = rows[0].number.split('-')
    seq = parseInt(parts[parts.length - 1], 10) + 1
  }
  return `${prefix}-${dateStr}-${String(seq).padStart(4, '0')}`
}

/**
 * Create a Sale + initial Note from a confirmed quote.
 * Must be called inside the quote state transition or standalone.
 */
export async function createSaleFromQuote(quoteId: string, userId: string): Promise<Sale> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Get quote data
    const { rows: [quote] } = await client.query(
      `SELECT id, number, customer_id, project_id, user_id,
              amount_untaxed, amount_tax, amount_total, unit_count
       FROM quotes WHERE id = $1`,
      [quoteId]
    )
    if (!quote) throw new Error('Quote not found')

    // 2. Generate VTA number
    const vtaNumber = await generateNumber('VTA', 'sales', client)

    // 3. Calculate totals (per unit × unit_count)
    const untaxed = Number(quote.amount_untaxed) * quote.unit_count
    const tax     = Number(quote.amount_tax) * quote.unit_count
    const total   = Number(quote.amount_total) * quote.unit_count

    // 4. Insert sale
    const { rows: [sale] } = await client.query(
      `INSERT INTO sales
         (number, quote_id, customer_id, project_id, user_id,
          amount_untaxed, amount_tax, amount_total, amount_balance, unit_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9)
       RETURNING *`,
      [vtaNumber, quoteId, quote.customer_id, quote.project_id, quote.user_id ?? userId,
       untaxed, tax, total, quote.unit_count]
    )

    // 5. Audit event
    await client.query(
      `INSERT INTO audit_events (entity, entity_id, type, payload)
       VALUES ('sale', $1, 'sale_created', $2)`,
      [sale.id, JSON.stringify({ quote_id: quoteId, quote_number: quote.number })]
    )

    await client.query('COMMIT')
    return sale
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateSaleState(id: string, state: string): Promise<void> {
  await pool.query('UPDATE sales SET state = $1 WHERE id = $2', [state, id])
}

/**
 * Recalculate amount_paid and amount_balance from confirmed payment applications.
 * Auto-sets state to 'paid' if balance reaches 0.
 */
export async function updateSaleTotals(id: string): Promise<void> {
  await pool.query(`
    UPDATE sales
    SET amount_paid = COALESCE((
          SELECT SUM(pa.amount)
          FROM payment_applications pa
          JOIN payments p ON p.id = pa.payment_id
          WHERE p.sale_id = sales.id AND p.state = 'confirmed'
        ), 0),
        amount_balance = amount_total - COALESCE((
          SELECT SUM(pa.amount)
          FROM payment_applications pa
          JOIN payments p ON p.id = pa.payment_id
          WHERE p.sale_id = sales.id AND p.state = 'confirmed'
        ), 0)
    WHERE id = $1
  `, [id])

  // Auto-mark as paid
  await pool.query(`
    UPDATE sales SET state = 'paid'
    WHERE id = $1 AND state = 'active' AND amount_balance <= 0
  `, [id])
}

export async function archiveSale(id: string): Promise<void> {
  await pool.query('UPDATE sales SET archived_at = now() WHERE id = $1', [id])
}

export async function unarchiveSale(id: string): Promise<void> {
  await pool.query('UPDATE sales SET archived_at = NULL WHERE id = $1', [id])
}
