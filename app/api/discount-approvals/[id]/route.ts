import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { reviewDiscountApproval, getDiscountApproval } from '@/lib/queries/discount-approvals'
import { createNotification } from '@/lib/queries/notifications'
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

  await reviewDiscountApproval(id, session.userId, decision)

  if (decision === 'approved') {
    // Update the line's discount_approval_status to 'approved'
    await pool.query(
      `UPDATE quote_lines SET discount_approval_status = 'approved' WHERE id = $1`,
      [approval.quote_line_id]
    )
    await updateQuoteTotals(approval.quote_id)
  } else {
    // Rejected: delete the discount line
    await pool.query(`DELETE FROM quote_lines WHERE id = $1`, [approval.quote_line_id])
    await updateQuoteTotals(approval.quote_id)
  }

  // Notify the requester
  await createNotification({
    user_id: approval.requested_by,
    type: decision === 'approved' ? 'discount_approved' : 'discount_rejected',
    title: decision === 'approved' ? 'Descuento aprobado' : 'Descuento rechazado',
    message: `Tu descuento del ${approval.discount_percent}% en la cotización ha sido ${decision === 'approved' ? 'aprobado' : 'rechazado'}.`,
    entity: 'quote',
    entity_id: approval.quote_id,
  })

  return NextResponse.json({ ok: true })
}
