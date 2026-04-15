import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized } from '@/lib/auth-guard'
import pool from '@/lib/db'

export interface PendingNote {
  id: string
  number: string
  sale_number: string
  sale_id: string
  amount_balance: string
  amount_total: string
  state: string
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { rows } = await pool.query<PendingNote>(`
    SELECT
      sn.id,
      sn.number,
      sn.state,
      sn.amount_balance::text,
      sn.amount_total::text,
      s.number AS sale_number,
      s.id     AS sale_id
    FROM sale_notes sn
    JOIN sales s ON s.id = sn.sale_id
    WHERE s.customer_id = $1
      AND sn.state NOT IN ('cancelled', 'paid')
      AND sn.amount_balance > 0.005
    ORDER BY sn.created_at ASC
  `, [id])

  return NextResponse.json(rows)
}
