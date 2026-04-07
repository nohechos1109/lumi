import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getDiscountApproval } from '@/lib/queries/discount-approvals'
import pool from '@/lib/db'
import { updateQuoteTotals } from '@/lib/queries/quotes'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (session.role !== 'admin') return forbidden()

  const { id } = await params
  const body = await req.json()
  const decision: 'approved' | 'rejected' = body.decision

  if (decision !== 'approved' && decision !== 'rejected') {
    return NextResponse.json({ error: 'decision must be approved or rejected' }, { status: 400 })
  }

  const approval = await getDiscountApproval(id)
  if (!approval) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (approval.status !== 'pending') {
    return NextResponse.json({ error: 'Esta solicitud ya fue procesada' }, { status: 409 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Mark approval as reviewed
    await client.query(
      `UPDATE discount_approvals SET status = $1, reviewed_by = $2, reviewed_at = now() WHERE id = $3`,
      [decision, session.userId, id]
    )

    if (decision === 'approved') {
      // 2a. Update line status
      await client.query(
        `UPDATE quote_lines SET discount_approval_status = 'approved' WHERE id = $1`,
        [approval.quote_line_id]
      )
    } else {
      // 2b. Delete the line
      await client.query(`DELETE FROM quote_lines WHERE id = $1`, [approval.quote_line_id])
    }

    // 3. Create notification
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, entity, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        approval.requested_by,
        decision === 'approved' ? 'discount_approved' : 'discount_rejected',
        decision === 'approved' ? 'Descuento aprobado' : 'Descuento rechazado',
        `Tu descuento del ${approval.discount_percent}% en la cotización ha sido ${decision === 'approved' ? 'aprobado' : 'rechazado'}.`,
        'quote',
        approval.quote_id,
      ]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  // Call updateQuoteTotals AFTER commit (uses pool.query internally, safe after tx)
  await updateQuoteTotals(approval.quote_id)

  return NextResponse.json({ ok: true })
}
