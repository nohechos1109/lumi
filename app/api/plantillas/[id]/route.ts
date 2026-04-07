import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import pool from '@/lib/db'
import { updatePlantilla, deletePlantilla } from '@/lib/queries/plantillas'

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
            p.id AS product_id, p.name, p.name AS product_name,
            p.sku AS product_sku, p.description,
            p.currency, p.cost_base, p.utility_fixed, p.utility_factor
     FROM plantilla_items pi
     LEFT JOIN products p ON p.id = pi.product_id
     WHERE pi.plantilla_id = $1
     ORDER BY pi.sequence`,
    [id]
  )

  return NextResponse.json({ ...plResult.rows[0], items: itemsResult.rows })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  const { nombre, requerimiento } = await req.json()
  if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  await updatePlantilla(id, nombre.trim(), requerimiento?.trim() || undefined)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { id } = await params
  await deletePlantilla(id)
  return NextResponse.json({ ok: true })
}
