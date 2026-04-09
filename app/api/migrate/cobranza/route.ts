import { NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import pool from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function POST() {
  const session = await getSession()
  if (!session || session.role !== 'admin') return unauthorized()

  const client = await pool.connect()
  try {
    const sql = fs.readFileSync(
      path.join(process.cwd(), 'db/migrations/002_cobranza.sql'),
      'utf-8'
    )
    await client.query('BEGIN')
    await client.query(sql)
    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      message: 'Migración de cobranza ejecutada correctamente. Tablas: sales, sale_notes, sale_note_lines, payments, payment_applications, payment_schedule_items',
    })
  } catch (error: unknown) {
    await client.query('ROLLBACK')
    console.error('Cobranza migration error:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}
