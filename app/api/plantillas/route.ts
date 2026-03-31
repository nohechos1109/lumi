import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import pool from '@/lib/db'

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
