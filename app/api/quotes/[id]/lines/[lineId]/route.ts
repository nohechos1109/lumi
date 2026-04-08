import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { updateLine, deleteLine } from '@/lib/queries/quote_lines'
import { updateQuoteTotals } from '@/lib/queries/quotes'
import pool from '@/lib/db'
import { createDiscountApproval } from '@/lib/queries/discount-approvals'
import { createNotification } from '@/lib/queries/notifications'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id, lineId } = await params
  const body = await req.json()

  // Existing guard: sales cannot manually set unit price
  if (session.role === 'sales' && body.unit_price_mxn_manual !== undefined) return forbidden()

  // Individual discount approval flow: sales + discount_percent > 0 on a product line
  if (session.role === 'sales' && body.discount_percent !== undefined && Number(body.discount_percent) > 0) {
    // Check the line exists and belongs to this quote
    const { rows: [line] } = await pool.query(
      `SELECT display_type, discount_approval_status FROM quote_lines WHERE id = $1 AND quote_id = $2`,
      [lineId, id]
    )
    if (!line) return NextResponse.json({ error: 'Línea no encontrada' }, { status: 404 })

    // Only product lines use this flow; global discount lines go through POST
    if (line.display_type === 'product') {
      // Block concurrent pending approval
      if (line.discount_approval_status === 'pending') {
        return NextResponse.json({ error: 'Ya existe una solicitud de descuento pendiente para esta línea' }, { status: 409 })
      }

      const requestedDiscount = Number(body.discount_percent)

      // Apply all other field changes (qty, name…) but NOT discount_percent.
      // updateLine() uses `data.discount_percent ?? current.discount_percent`, so stripping it
      // here preserves the existing approved discount_percent on the line.
      const { discount_percent: _ignored, ...restBody } = body
      if (Object.keys(restBody).length > 0) {
        await updateLine(lineId, restBody)
      }

      // Mark line as pending
      await pool.query(
        `UPDATE quote_lines SET discount_approval_status = 'pending' WHERE id = $1`,
        [lineId]
      )

      // Get the line name for the notification message
      const { rows: [lineInfo] } = await pool.query(
        `SELECT name FROM quote_lines WHERE id = $1`,
        [lineId]
      )

      // Create approval record
      const discountApproval = await createDiscountApproval({
        quote_id: id,
        quote_line_id: lineId,
        requested_by: session.userId,
        discount_percent: requestedDiscount,
      })

      // Notify all admins
      const { rows: admins } = await pool.query(`SELECT id FROM users WHERE role = 'admin'`)
      await Promise.all(admins.map((admin: { id: string }) =>
        createNotification({
          user_id: admin.id,
          type: 'discount_request',
          title: 'Nueva solicitud de descuento',
          message: `Vendedor solicitó un descuento del ${requestedDiscount}% en "${lineInfo?.name ?? 'producto'}".`,
          entity: 'discount_approval',
          entity_id: discountApproval.id,
        })
      ))

      // updateQuoteTotals is still called but since discount_percent on the line was NOT changed,
      // the product line's subtotal is unchanged and totals remain correct (pending discount excluded).
      await updateQuoteTotals(id)
      return NextResponse.json({ ok: true })
    }
  }

  // Default flow for non-sales or zero discount
  await updateLine(lineId, body)
  await updateQuoteTotals(id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id, lineId } = await params
  await deleteLine(lineId)
  await updateQuoteTotals(id)
  return NextResponse.json({ ok: true })
}
