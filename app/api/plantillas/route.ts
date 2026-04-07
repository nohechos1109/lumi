import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import pool from '@/lib/db'
import { createPlantilla } from '@/lib/queries/plantillas'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const { rows } = await pool.query(
    `SELECT id, nombre, requerimiento,
            (SELECT COUNT(*) FROM plantilla_items WHERE plantilla_id = p.id) AS item_count
     FROM plantillas p
     ORDER BY nombre`
  )
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()
  const { nombre, requerimiento } = await req.json()
  if (!nombre?.trim()) return NextResponse.json({ error: 'Nombre requerido' }, { status: 400 })
  const plantilla = await createPlantilla(nombre.trim(), requerimiento?.trim() || undefined)
  return NextResponse.json(plantilla, { status: 201 })
}
