import pool from '@/lib/db'

export interface DiscountApproval {
  id: string
  quote_id: string
  quote_line_id: string
  requested_by: string
  discount_percent: string
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  // Joined fields
  quote_number?: string
  requester_username?: string
  quote_line_name?: string
}

export async function listPendingApprovals(): Promise<DiscountApproval[]> {
  const { rows } = await pool.query(
    `SELECT da.*, q.number as quote_number, u.username as requester_username, ql.name as quote_line_name
     FROM discount_approvals da
     JOIN quotes q ON q.id = da.quote_id
     JOIN users u ON u.id = da.requested_by
     JOIN quote_lines ql ON ql.id = da.quote_line_id
     WHERE da.status = 'pending'
     ORDER BY da.created_at DESC`
  )
  return rows
}

export async function createDiscountApproval(data: {
  quote_id: string
  quote_line_id: string
  requested_by: string
  discount_percent: number
}): Promise<DiscountApproval> {
  const { rows } = await pool.query(
    `INSERT INTO discount_approvals (quote_id, quote_line_id, requested_by, discount_percent)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.quote_id, data.quote_line_id, data.requested_by, data.discount_percent]
  )
  return rows[0]
}

export async function reviewDiscountApproval(
  id: string,
  reviewedBy: string,
  decision: 'approved' | 'rejected'
): Promise<DiscountApproval> {
  const { rows } = await pool.query(
    `UPDATE discount_approvals
     SET status = $1, reviewed_by = $2, reviewed_at = now()
     WHERE id = $3 RETURNING *`,
    [decision, reviewedBy, id]
  )
  return rows[0]
}

export async function getDiscountApproval(id: string): Promise<DiscountApproval | null> {
  const { rows } = await pool.query(
    `SELECT da.*, q.number as quote_number, u.username as requester_username, ql.name as quote_line_name
     FROM discount_approvals da
     JOIN quotes q ON q.id = da.quote_id
     JOIN users u ON u.id = da.requested_by
     JOIN quote_lines ql ON ql.id = da.quote_line_id
     WHERE da.id = $1`,
    [id]
  )
  return rows[0] ?? null
}
