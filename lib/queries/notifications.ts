import pool from '@/lib/db'

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  entity: string | null
  entity_id: string | null
  read: boolean
  created_at: string
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  await pool.query(
    `DELETE FROM notifications WHERE user_id = $1 AND created_at < NOW() - INTERVAL '1 day'`,
    [userId]
  )
  const { rows } = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId]
  )
  return rows
}

export async function markNotificationRead(id: string, userId: string): Promise<void> {
  await pool.query(
    `UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2`,
    [id, userId]
  )
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await pool.query(
    `UPDATE notifications SET read = true WHERE user_id = $1`,
    [userId]
  )
}

export async function clearAllNotifications(userId: string): Promise<void> {
  await pool.query(
    `DELETE FROM notifications WHERE user_id = $1`,
    [userId]
  )
}

export async function createNotification(data: {
  user_id: string
  type: string
  title: string
  message?: string
  entity?: string
  entity_id?: string
}): Promise<void> {
  await pool.query(
    `INSERT INTO notifications (user_id, type, title, message, entity, entity_id)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [data.user_id, data.type, data.title, data.message ?? null, data.entity ?? null, data.entity_id ?? null]
  )
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = false`,
    [userId]
  )
  return Number(rows[0].count)
}
