import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getUnidad, updateUnidad, deleteUnidad } from '@/lib/queries/unidades'
import pool from '@/lib/db'
import { insertAuditEvent } from '@/lib/queries/audit'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params
  const unidad = await getUnidad(id)
  if (!unidad) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(unidad)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const adminLike = ['admin', 'manager', 'soporte'].includes(session.role)

  if (!adminLike) {
    if (session.role !== 'tecnico') return forbidden()
    const { rows } = await pool.query(
      `SELECT 1
       FROM services s
       LEFT JOIN service_technicians st ON st.service_id = s.id AND st.user_id = $1
       LEFT JOIN service_order_technicians sot ON sot.service_order_id = s.service_order_id AND sot.user_id = $1
       WHERE s.unidad_id = $2
         AND s.estatus IN ('en_curso','en_revision')
         AND (st.user_id IS NOT NULL OR sot.user_id IS NOT NULL)
       LIMIT 1`,
      [session.userId, id]
    )
    if (rows.length === 0) return forbidden()
  }

  const body = await req.json()
  await updateUnidad(id, body)
  await insertAuditEvent('unidad', id, 'updated', { actor: session.userId, fields: Object.keys(body) })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin' && session.role !== 'manager') return forbidden()

  const { id } = await params
  try {
    await deleteUnidad(id)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'No se puede eliminar (tiene notas vinculadas)' }, { status: 409 })
  }
}
