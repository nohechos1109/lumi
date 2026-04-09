import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
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

  const isProductLine = approval.quote_line_display_type === 'product'

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Mark approval as reviewed
    await client.query(
      `UPDATE discount_approvals SET status = $1, reviewed_by = $2, reviewed_at = now() WHERE id = $3`,
      [decision, session.userId, id]
    )

    if (decision === 'approved') {
      if (isProductLine) {
        // Apply the pending discount_percent and recalculate subtotal.
        // updateQuoteTotals() step 0 will fix tax_amount and total for product lines after commit.
        await client.query(
          `UPDATE quote_lines
           SET discount_percent = $1,
               discount_approval_status = 'approved',
               subtotal = unit_price_mxn_effective * COALESCE(qty, 1) * (1 - $1::numeric / 100),
               margin_amount = unit_price_mxn_effective * COALESCE(qty, 1) * (1 - $1::numeric / 100)
                               - (cost_base_snapshot * fx_snapshot * COALESCE(qty, 1))
           WHERE id = $2`,
          [Number(approval.discount_percent), approval.quote_line_id]
        )
      } else {
        // Global discount line: apply the requested discount_percent and mark as approved
        // (updateQuoteTotals recalibrates the subtotal based on the new percent)
        await client.query(
          `UPDATE quote_lines SET discount_percent = $1, discount_approval_status = 'approved' WHERE id = $2`,
          [Number(approval.discount_percent), approval.quote_line_id]
        )
      }
    } else {
      // Rejected
      if (isProductLine) {
        // Clear the pending flag — do NOT delete the product line
        await client.query(
          `UPDATE quote_lines SET discount_approval_status = NULL WHERE id = $1`,
          [approval.quote_line_id]
        )
      } else {
        // Global discount line: delete it
        await client.query(`DELETE FROM quote_lines WHERE id = $1`, [approval.quote_line_id])
      }
    }

    // Notify requesting user
    await client.query(
      `INSERT INTO notifications (user_id, type, title, message, entity, entity_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        approval.requested_by,
        decision === 'approved' ? 'discount_approved' : 'discount_rejected',
        decision === 'approved' ? 'Descuento aprobado' : 'Descuento rechazado',
        `Tu descuento del ${approval.discount_percent}% ${isProductLine ? `en "${approval.quote_line_name}"` : 'en la cotización'} ha sido ${decision === 'approved' ? 'aprobado' : 'rechazado'}.`,
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

  revalidatePath('/admin/discount-approvals')
  revalidatePath('/quotes')
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params

  const approval = await getDiscountApproval(id)
  if (!approval) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only the requester or an admin can cancel
  if (session.role !== 'admin' && approval.requested_by !== session.userId) return forbidden()

  if (approval.status !== 'pending') {
    return NextResponse.json({ error: 'Esta solicitud ya fue procesada' }, { status: 409 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Delete the approval record
    await client.query(`DELETE FROM discount_approvals WHERE id = $1`, [id])

    // Reset line status so the discount field becomes editable again
    await client.query(
      `UPDATE quote_lines SET discount_approval_status = NULL WHERE id = $1`,
      [approval.quote_line_id]
    )

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  await updateQuoteTotals(approval.quote_id)
  return NextResponse.json({ ok: true })
}
