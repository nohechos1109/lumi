import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import pool from '@/lib/db'

export async function POST() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return unauthorized()

  try {
    await pool.query(`
      ALTER TABLE quotes
      ADD COLUMN IF NOT EXISTS installation_notes TEXT DEFAULT NULL
    `)
    return NextResponse.json({ ok: true, message: 'Columna installation_notes agregada (o ya existía).' })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
