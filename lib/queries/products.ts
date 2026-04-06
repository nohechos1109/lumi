import pool from '@/lib/db'

export interface Product {
  id: string
  sku: string | null
  name: string
  description: string | null
  currency: 'MXN' | 'USD'
  cost_base: string
  utility_fixed: string
  utility_factor: string
  codigo_sat: string | null
  codigo_proveedor: string | null
}

export async function listProducts(): Promise<Product[]> {
  const { rows } = await pool.query(
    'SELECT id, sku, name, description, currency, cost_base, utility_fixed, utility_factor, codigo_sat, codigo_proveedor FROM products ORDER BY name'
  )
  return rows
}

export async function searchProducts(q: string): Promise<Product[]> {
  const { rows } = await pool.query(
    `SELECT id, sku, name, description, currency, cost_base, utility_fixed, utility_factor, codigo_sat, codigo_proveedor
     FROM products
     WHERE name ILIKE $1 OR sku ILIKE $1 OR description ILIKE $1
     ORDER BY name LIMIT 20`,
    [`%${q}%`]
  )
  return rows
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  const { rows } = await pool.query(
    `INSERT INTO products (sku, name, description, currency, cost_base, utility_fixed, utility_factor, codigo_sat, codigo_proveedor)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [data.sku, data.name, data.description, data.currency, data.cost_base, data.utility_fixed, data.utility_factor, data.codigo_sat, data.codigo_proveedor]
  )
  return rows[0]
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id'>>): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  const allowed = ['sku','name','description','currency','cost_base','utility_fixed','utility_factor','codigo_sat','codigo_proveedor'] as const
  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = $${i++}`); values.push(data[key]) }
  }
  if (!fields.length) return
  values.push(id)
  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteProduct(id: string): Promise<void> {
  await pool.query('DELETE FROM products WHERE id = $1', [id])
}
