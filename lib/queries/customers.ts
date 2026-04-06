import pool from '@/lib/db'

export interface Customer { id: string; name: string; email: string | null; phone: string | null }

export async function listCustomers(): Promise<Customer[]> {
  const { rows } = await pool.query('SELECT id, name, email, phone FROM customers ORDER BY name')
  return rows
}

export async function createCustomer(name: string, email?: string, phone?: string): Promise<Customer> {
  const { rows } = await pool.query(
    'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING id, name, email, phone',
    [name, email || null, phone || null]
  )
  return rows[0]
}

export async function updateCustomer(id: string, name: string, email?: string, phone?: string): Promise<void> {
  await pool.query(
    'UPDATE customers SET name = $1, email = $2, phone = $3 WHERE id = $4',
    [name, email || null, phone || null, id]
  )
}

export async function deleteCustomer(id: string): Promise<void> {
  await pool.query('DELETE FROM customers WHERE id = $1', [id])
}
