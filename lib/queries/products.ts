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
  image_url: string | null
  category: string | null
  public_price: string | null
}

export async function listProducts(): Promise<Product[]> {
  const { rows } = await pool.query(
    'SELECT id, sku, name, description, currency, cost_base, utility_fixed, utility_factor, codigo_sat, codigo_proveedor, image_url, category, public_price FROM products ORDER BY name'
  )
  return rows
}

export async function searchProducts(q: string): Promise<Product[]> {
  const { rows } = await pool.query(
    `SELECT id, sku, name, description, currency, cost_base, utility_fixed, utility_factor, codigo_sat, codigo_proveedor, image_url, category,
            COALESCE(public_price, cost_base * utility_factor + utility_fixed) AS public_price
     FROM products
     WHERE name ILIKE $1 OR sku ILIKE $1 OR description ILIKE $1
     ORDER BY name LIMIT 20`,
    [`%${q}%`]
  )
  return rows
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<Product> {
  const { rows } = await pool.query(
    `INSERT INTO products (sku, name, description, currency, cost_base, utility_fixed, utility_factor, codigo_sat, codigo_proveedor, image_url, category, public_price)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [data.sku || null, data.name, data.description || null, data.currency, data.cost_base, data.utility_fixed, data.utility_factor, data.codigo_sat || null, data.codigo_proveedor || null, data.image_url || null, data.category || null, data.public_price || null]
  )
  return rows[0]
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id'>>): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  const allowed = ['sku','name','description','currency','cost_base','utility_fixed','utility_factor','codigo_sat','codigo_proveedor','image_url','category','public_price'] as const
  for (const key of allowed) {
    if (data[key] !== undefined) { fields.push(`${key} = $${i++}`); values.push(data[key]) }
  }
  if (!fields.length) return
  values.push(id)
  await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function listCategories(): Promise<string[]> {
  const { rows } = await pool.query(
    'SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category'
  )
  return rows.map((r: { category: string }) => r.category)
}

export async function deleteProduct(id: string): Promise<void> {
  await pool.query('DELETE FROM products WHERE id = $1', [id])
}

export interface CatalogProduct {
  id: string
  sku: string | null
  name: string
  description: string | null
  category: string | null
  currency: string
  image_url: string | null
  codigo_sat: string | null
  price_without_tax: number
  price_with_tax: number
}

export async function listProductsCatalog(fxRate: number): Promise<CatalogProduct[]> {
  const { rows } = await pool.query(
    `SELECT
       id, sku, name, description, category, currency, image_url, codigo_sat,
       CASE WHEN currency = 'USD'
         THEN (cost_base * utility_factor + utility_fixed) * $1
         ELSE (cost_base * utility_factor + utility_fixed)
       END AS price_without_tax,
       CASE WHEN currency = 'USD'
         THEN (cost_base * utility_factor + utility_fixed) * $1 * 1.16
         ELSE (cost_base * utility_factor + utility_fixed) * 1.16
       END AS price_with_tax
     FROM products
     ORDER BY category NULLS LAST, name`,
    [fxRate]
  )
  return rows.map((r: Record<string, unknown>) => ({
    ...r,
    price_without_tax: Number(r.price_without_tax),
    price_with_tax: Number(r.price_with_tax),
  })) as CatalogProduct[]
}
