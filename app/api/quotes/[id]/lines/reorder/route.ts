import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import pool from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { order } = await req.json() as { order: { id: string; sequence: number }[] }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (const item of order) {
      await client.query(
        'UPDATE quote_lines SET sequence = $1 WHERE id = $2 AND quote_id = $3',
        [item.sequence, item.id, id]
      )
    }
    await client.query('COMMIT')
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }

  return NextResponse.json({ ok: true })
}
