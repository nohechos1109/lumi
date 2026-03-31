import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import pool from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params

  const plResult = await pool.query(
    'SELECT id, nombre, requerimiento FROM plantillas WHERE id = $1',
    [id]
  )
  if (plResult.rows.length === 0) {
    return NextResponse.json({ error: 'No encontrada' }, { status: 404 })
  }

  const itemsResult = await pool.query(
    `SELECT pi.qty, 0 AS discount_percent, pi.sequence,
            p.id AS product_id, p.name, p.description,
            p.currency, p.cost_base, p.utility_fixed, p.utility_factor
     FROM plantilla_items pi
     JOIN products p ON p.id = pi.product_id
     WHERE pi.plantilla_id = $1
     ORDER BY pi.sequence`,
    [id]
  )

  return NextResponse.json({ ...plResult.rows[0], items: itemsResult.rows })
}
