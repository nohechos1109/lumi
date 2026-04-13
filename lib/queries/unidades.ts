import pool from '@/lib/db'

export interface Unidad {
  id: string
  name: string
  ruta_id: string | null
  empresa_id: string | null
  dueno_id: string | null
  dashcam: 'dashcam' | 'streamax' | null
  pantalla: boolean
  impresora: boolean
  reversa: boolean
  reconocimiento_facial: boolean
  fecha_instalacion: string | null
  descripcion_instalacion: string | null
  observaciones: string | null
  created_at: string
  // joined
  ruta_name?: string
  empresa_name?: string
  dueno_name?: string
}

export interface CreateUnidadInput {
  name: string
  ruta_id?: string | null
  empresa_id?: string | null
  dueno_id?: string | null
  dashcam?: 'dashcam' | 'streamax' | null
  pantalla?: boolean
  impresora?: boolean
  reversa?: boolean
  reconocimiento_facial?: boolean
  fecha_instalacion?: string | null
  descripcion_instalacion?: string | null
  observaciones?: string | null
}

const SELECT_UNIDADES = `
  SELECT u.*,
    r.name  AS ruta_name,
    ce.name AS empresa_name,
    cd.name AS dueno_name
  FROM unidades u
  LEFT JOIN rutas    r  ON r.id  = u.ruta_id
  LEFT JOIN contacts ce ON ce.id = u.empresa_id
  LEFT JOIN contacts cd ON cd.id = u.dueno_id
`

export async function getUnidades(filters?: { ruta_id?: string }): Promise<Unidad[]> {
  const conditions: string[] = []
  const values: string[] = []
  if (filters?.ruta_id) { conditions.push(`u.ruta_id = $${values.push(filters.ruta_id)}`); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const { rows } = await pool.query(`${SELECT_UNIDADES} ${where} ORDER BY u.name`, values)
  return rows
}

export async function getUnidad(id: string): Promise<Unidad | null> {
  const { rows } = await pool.query(`${SELECT_UNIDADES} WHERE u.id = $1`, [id])
  return rows[0] ?? null
}

export async function createUnidad(data: CreateUnidadInput): Promise<Unidad> {
  const { rows } = await pool.query(
    `INSERT INTO unidades
       (name, ruta_id, empresa_id, dueno_id, dashcam,
        pantalla, impresora, reversa, reconocimiento_facial,
        fecha_instalacion, descripcion_instalacion, observaciones)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [
      data.name,
      data.ruta_id ?? null,
      data.empresa_id ?? null,
      data.dueno_id ?? null,
      data.dashcam ?? null,
      data.pantalla ?? false,
      data.impresora ?? false,
      data.reversa ?? false,
      data.reconocimiento_facial ?? false,
      data.fecha_instalacion ?? null,
      data.descripcion_instalacion ?? null,
      data.observaciones ?? null,
    ]
  )
  return rows[0]
}

export async function updateUnidad(id: string, data: Partial<CreateUnidadInput>): Promise<void> {
  const fields: string[] = []
  const values: unknown[] = []
  let i = 1
  const add = (col: string, val: unknown) => { fields.push(`${col} = $${i++}`); values.push(val) }

  if (data.name !== undefined)                  add('name', data.name)
  if (data.ruta_id !== undefined)               add('ruta_id', data.ruta_id ?? null)
  if (data.empresa_id !== undefined)            add('empresa_id', data.empresa_id ?? null)
  if (data.dueno_id !== undefined)              add('dueno_id', data.dueno_id ?? null)
  if (data.dashcam !== undefined)               add('dashcam', data.dashcam ?? null)
  if (data.pantalla !== undefined)              add('pantalla', data.pantalla)
  if (data.impresora !== undefined)             add('impresora', data.impresora)
  if (data.reversa !== undefined)               add('reversa', data.reversa)
  if (data.reconocimiento_facial !== undefined) add('reconocimiento_facial', data.reconocimiento_facial)
  if (data.fecha_instalacion !== undefined)     add('fecha_instalacion', data.fecha_instalacion ?? null)
  if (data.descripcion_instalacion !== undefined) add('descripcion_instalacion', data.descripcion_instalacion ?? null)
  if (data.observaciones !== undefined)         add('observaciones', data.observaciones ?? null)

  if (fields.length === 0) return
  values.push(id)
  await pool.query(`UPDATE unidades SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

export async function deleteUnidad(id: string): Promise<void> {
  await pool.query('DELETE FROM unidades WHERE id = $1', [id])
}

/**
 * Returns quote lines for the sale's quote, each annotated with the total
 * qty already added in non-cancelled notes for the given unit.
 */
export interface QuoteLineCoverage {
  quote_line_id: string
  product_id: string | null
  name: string
  qty_quoted: number
  qty_used: number
  qty_remaining: number
}

export async function getQuoteLineCoverageForUnit(
  saleId: string,
  unitId: string
): Promise<QuoteLineCoverage[]> {
  const { rows } = await pool.query(
    `SELECT
       ql.id              AS quote_line_id,
       ql.product_id,
       ql.name,
       COALESCE(ql.qty, 0)::numeric                                           AS qty_quoted,
       COALESCE(SUM(snl.qty) FILTER (
         WHERE sn.unit_id = $2
           AND sn.state   != 'cancelled'
       ), 0)::numeric                                                          AS qty_used,
       GREATEST(
         COALESCE(ql.qty, 0) - COALESCE(SUM(snl.qty) FILTER (
           WHERE sn.unit_id = $2
             AND sn.state   != 'cancelled'
         ), 0),
         0
       )::numeric                                                              AS qty_remaining
     FROM sales s
     JOIN quotes      q   ON q.id  = s.quote_id
     JOIN quote_lines ql  ON ql.quote_id = q.id
     LEFT JOIN sale_notes     sn  ON sn.sale_id = s.id
     LEFT JOIN sale_note_lines snl ON snl.sale_note_id = sn.id
                                  AND snl.quote_line_id = ql.id
     WHERE s.id = $1
       AND (ql.display_type = 'product' OR ql.display_type IS NULL)
       AND ql.qty > 0
     GROUP BY ql.id, ql.product_id, ql.name, ql.qty, ql.sequence
     ORDER BY ql.sequence`,
    [saleId, unitId]
  )
  return rows.map(r => ({
    quote_line_id: r.quote_line_id,
    product_id: r.product_id,
    name: r.name,
    qty_quoted: Number(r.qty_quoted),
    qty_used: Number(r.qty_used),
    qty_remaining: Number(r.qty_remaining),
  }))
}
