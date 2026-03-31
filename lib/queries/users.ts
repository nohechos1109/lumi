import pool from '@/lib/db'

export interface User {
  id: string
  role: 'sales' | 'manager' | 'admin'
  username: string
  password_hash: string
}

export async function findByUsername(username: string): Promise<User | null> {
  const { rows } = await pool.query(
    'SELECT id, role, username, password_hash FROM users WHERE username = $1',
    [username]
  )
  return rows[0] ?? null
}

export async function findById(id: string): Promise<Omit<User, 'password_hash'> | null> {
  const { rows } = await pool.query(
    'SELECT id, role, username FROM users WHERE id = $1',
    [id]
  )
  return rows[0] ?? null
}

export async function listUsers(): Promise<Omit<User, 'password_hash'>[]> {
  const { rows } = await pool.query(
    'SELECT id, role, username FROM users ORDER BY role, username'
  )
  return rows
}

export async function createUser(username: string, role: string, password_hash: string): Promise<User> {
  const { rows } = await pool.query(
    'INSERT INTO users (username, role, password_hash) VALUES ($1, $2, $3) RETURNING id, role, username, password_hash',
    [username, role, password_hash]
  )
  return rows[0]
}

export async function updateUser(id: string, data: { username?: string; role?: string; password_hash?: string }): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  if (data.username)      { fields.push(`username = $${i++}`);      values.push(data.username) }
  if (data.role)          { fields.push(`role = $${i++}`);          values.push(data.role) }
  if (data.password_hash) { fields.push(`password_hash = $${i++}`); values.push(data.password_hash) }
  if (!fields.length) return
  values.push(id)
  await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteUser(id: string): Promise<void> {
  await pool.query('DELETE FROM users WHERE id = $1', [id])
}
