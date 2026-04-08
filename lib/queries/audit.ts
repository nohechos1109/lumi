import pool from '@/lib/db'

export interface AuditEvent {
  id: string
  entity: string
  entity_id: string
  type: string
  payload: Record<string, unknown>
  created_at: string
}

export async function insertAuditEvent(
  entity: string,
  entity_id: string,
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  await pool.query(
    `INSERT INTO audit_events (entity, entity_id, type, payload)
     VALUES ($1, $2, $3, $4)`,
    [entity, entity_id, type, JSON.stringify(payload)]
  )
}

export async function getAuditEvents(
  entity: string,
  entity_id: string
): Promise<AuditEvent[]> {
  const { rows } = await pool.query(
    `SELECT * FROM audit_events
     WHERE entity = $1 AND entity_id = $2
     ORDER BY created_at DESC`,
    [entity, entity_id]
  )
  return rows
}
