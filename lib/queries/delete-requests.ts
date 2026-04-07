import pool from '@/lib/db'

export interface DeleteRequest {
  id: string
  entity: string
  entity_id: string
  requested_by: string
  reason: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  // Joined
  requester_username?: string
  entity_name?: string
}

export async function createDeleteRequest(data: {
  entity: string
  entity_id: string
  requested_by: string
  reason?: string
}): Promise<DeleteRequest> {
  const { rows } = await pool.query(
    `INSERT INTO delete_requests (entity, entity_id, requested_by, reason)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [data.entity, data.entity_id, data.requested_by, data.reason ?? null]
  )
  return rows[0]
}

export async function listPendingDeleteRequests(): Promise<DeleteRequest[]> {
  const { rows } = await pool.query(
    `SELECT dr.*, u.username as requester_username,
       CASE dr.entity
         WHEN 'customer' THEN c.name
         ELSE NULL
       END as entity_name
     FROM delete_requests dr
     JOIN users u ON u.id = dr.requested_by
     LEFT JOIN customers c ON c.id = dr.entity_id AND dr.entity = 'customer'
     WHERE dr.status = 'pending'
     ORDER BY dr.created_at DESC`
  )
  return rows
}

export async function reviewDeleteRequest(
  id: string,
  reviewedBy: string,
  decision: 'approved' | 'rejected'
): Promise<DeleteRequest> {
  const { rows } = await pool.query(
    `UPDATE delete_requests SET status = $1, reviewed_by = $2, reviewed_at = now()
     WHERE id = $3 RETURNING *`,
    [decision, reviewedBy, id]
  )
  return rows[0]
}

export async function getDeleteRequest(id: string): Promise<DeleteRequest | null> {
  const { rows } = await pool.query(
    'SELECT * FROM delete_requests WHERE id = $1',
    [id]
  )
  return rows[0] ?? null
}
