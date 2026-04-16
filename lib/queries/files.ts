import pool from '@/lib/db'

export interface FileRecord {
  id: string
  entity_type: string
  entity_id: string
  filename: string
  original_name: string
  mime_type: string
  file_size: number
  file_path: string
  uploaded_by: string | null
  created_at: string
  uploaded_by_username?: string
}

export async function listFilesByEntity(entityType: string, entityId: string): Promise<FileRecord[]> {
  const { rows } = await pool.query(
    `SELECT f.*, u.username AS uploaded_by_username
     FROM files f
     LEFT JOIN users u ON u.id = f.uploaded_by
     WHERE f.entity_type = $1 AND f.entity_id = $2
     ORDER BY f.created_at DESC`,
    [entityType, entityId]
  )
  return rows
}

export async function getFile(id: string): Promise<FileRecord | null> {
  const { rows } = await pool.query(
    `SELECT * FROM files WHERE id = $1`,
    [id]
  )
  return rows[0] ?? null
}

export interface CreateFileInput {
  entity_type: string
  entity_id: string
  filename: string
  original_name: string
  mime_type: string
  file_size: number
  file_path: string
  uploaded_by: string
}

export async function createFileRecord(data: CreateFileInput): Promise<FileRecord> {
  const { rows: [f] } = await pool.query(
    `INSERT INTO files (entity_type, entity_id, filename, original_name, mime_type, file_size, file_path, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [data.entity_type, data.entity_id, data.filename, data.original_name, data.mime_type, data.file_size, data.file_path, data.uploaded_by]
  )
  return f
}

export async function deleteFileRecord(id: string): Promise<FileRecord | null> {
  const { rows } = await pool.query(
    `DELETE FROM files WHERE id = $1 RETURNING *`,
    [id]
  )
  return rows[0] ?? null
}
