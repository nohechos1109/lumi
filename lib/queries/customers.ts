import pool from '@/lib/db'

export interface Customer { id: string; name: string }

export async function listCustomers(): Promise<Customer[]> {
  const { rows } = await pool.query('SELECT id, name FROM customers ORDER BY name')
  return rows
}

export async function createCustomer(name: string): Promise<Customer> {
  const { rows } = await pool.query(
    'INSERT INTO customers (name) VALUES ($1) RETURNING id, name', [name]
  )
  return rows[0]
}

export async function updateCustomer(id: string, name: string): Promise<void> {
  await pool.query('UPDATE customers SET name = $1 WHERE id = $2', [name, id])
}

export async function deleteCustomer(id: string): Promise<void> {
  await pool.query('DELETE FROM customers WHERE id = $1', [id])
}
