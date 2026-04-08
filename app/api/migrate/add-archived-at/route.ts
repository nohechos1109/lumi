import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { secret } = await req.json()

    if (secret !== process.env.MIGRATION_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await pool.query(`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
    `)

    await pool.query(`
      ALTER TABLE quotes ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ NULL;
    `)

    return NextResponse.json({
      success: true,
      message: 'Columna archived_at agregada a projects y quotes.',
    })
  } catch (error: any) {
    console.error('Migration error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
