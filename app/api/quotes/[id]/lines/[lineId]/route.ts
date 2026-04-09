import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canSetManualPrice, canRequestDiscounts } from '@/lib/permissions'
import { updateLine, deleteLine } from '@/lib/queries/quote_lines'
import { updateQuoteTotals } from '@/lib/queries/quotes'
import pool from '@/lib/db'
import { broadcastToUser, broadcastToUsers } from '@/lib/sse'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id, lineId } = await params
  const body = await req.json()

  // Existing guard: sales cannot manually set unit price
  if (!canSetManualPrice(session.role) && body.unit_price_mxn_manual !== undefined) return forbidden()

  // Individual discount approval flow: sales + discount_percent > 0 on a product line
  if (canRequestDiscounts(session.role) && body.discount_percent !== undefined && Number(body.discount_percent) > 0) {
    // Check the line exists, belongs to this quote, and the quote belongs to this user
    const { rows: [line] } = await pool.query(
      `SELECT ql.display_type, ql.discount_approval_status, ql.name
       FROM quote_lines ql
       JOIN quotes q ON q.id = ql.quote_id
       WHERE ql.id = $1 AND ql.quote_id = $2 AND q.user_id = $3`,
      [lineId, id, session.userId]
    )
    if (!line) return forbidden()

    // Global discount line re-approval: when a sales user changes an already-approved discount
    if (line.display_type === 'discount') {
      const requestedDiscount = Number(body.discount_percent)

      let approval!: { id: string }
      let admins: { id: string }[] = []

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        const { rows: [lockedLine] } = await client.query(
          `SELECT discount_approval_status, discount_percent FROM quote_lines WHERE id = $1 FOR UPDATE`,
          [lineId]
        )

        if (lockedLine.discount_approval_status === 'pending') {
          await client.query('ROLLBACK')
          return NextResponse.json({ error: 'Ya existe una solicitud de descuento pendiente para esta línea' }, { status: 409 })
        }

        // No-op if the requested value matches the current approved value
        if (requestedDiscount === Number(lockedLine.discount_percent)) {
          await client.query('ROLLBACK')
          return NextResponse.json({ ok: true })
        }

        // Mark as pending — do NOT update discount_percent yet (admin must approve first)
        await client.query(
          `UPDATE quote_lines SET discount_approval_status = 'pending' WHERE id = $1`,
          [lineId]
        )

        // Create approval record
        const { rows: [_approval] } = await client.query(
          `INSERT INTO discount_approvals (quote_id, quote_line_id, requested_by, discount_percent)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [id, lineId, session.userId, requestedDiscount]
        )
        approval = _approval

        // Notify admins
        const { rows: _admins } = await client.query(`SELECT id FROM users WHERE role = 'admin'`)
        admins = _admins
        await Promise.all(admins.map((admin: { id: string }) =>
          client.query(
            `INSERT INTO notifications (user_id, type, title, message, entity, entity_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              admin.id,
              'discount_request',
              'Nueva solicitud de descuento',
              `Vendedor solicitó cambiar el descuento global al ${requestedDiscount}% en la cotización.`,
              'discount_approval',
              approval.id,
            ]
          )
        ))

        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }

      broadcastToUsers(
        admins.map((a: { id: string }) => a.id),
        'discount_request',
        {
          approvalId: approval.id,
          quoteId: id,
          quoteNumber: null,
          requesterUsername: session.username,
          quoteLineName: 'Descuento Global',
          quoteLineDisplayType: 'discount',
          discountPercent: requestedDiscount,
          createdAt: new Date().toISOString(),
        }
      )
      for (const admin of admins) {
        broadcastToUser(admin.id, 'notification', {
          type: 'discount_request',
          title: 'Nueva solicitud de descuento',
          message: `Vendedor solicitó cambiar el descuento global al ${requestedDiscount}%.`,
          entity: 'discount_approval',
          entity_id: approval.id,
          read: false,
          created_at: new Date().toISOString(),
        })
      }

      // Totals are unchanged since discount_percent on the line was NOT modified
      await updateQuoteTotals(id)
      revalidatePath('/quotes')
      revalidatePath('/admin/discount-approvals')
      return NextResponse.json({ ok: true })
    }

    // Only product lines use this flow; global discount lines go through POST
    if (line.display_type === 'product') {
      const requestedDiscount = Number(body.discount_percent)

      // Apply all other field changes (qty, name…) but NOT discount_percent.
      // updateLine() uses `data.discount_percent ?? current.discount_percent`, so stripping it
      // here preserves the existing approved discount_percent on the line.
      const { discount_percent: _ignored, ...restBody } = body
      if (Object.keys(restBody).length > 0) {
        await updateLine(lineId, restBody)
      }

      let approval!: { id: string }
      let admins: { id: string }[] = []

      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        // Lock the row to prevent concurrent approvals
        const { rows: [lockedLine] } = await client.query(
          `SELECT discount_approval_status, discount_percent FROM quote_lines WHERE id = $1 FOR UPDATE`,
          [lineId]
        )

        if (lockedLine.discount_approval_status === 'pending') {
          await client.query('ROLLBACK')
          return NextResponse.json({ error: 'Ya existe una solicitud de descuento pendiente para esta línea' }, { status: 409 })
        }

        // No-op if the requested value matches the current approved value
        if (requestedDiscount === Number(lockedLine.discount_percent)) {
          await client.query('ROLLBACK')
          return NextResponse.json({ ok: true })
        }

        // Mark line as pending
        await client.query(
          `UPDATE quote_lines SET discount_approval_status = 'pending' WHERE id = $1`,
          [lineId]
        )

        // Create approval record
        const { rows: [_approval] } = await client.query(
          `INSERT INTO discount_approvals (quote_id, quote_line_id, requested_by, discount_percent)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [id, lineId, session.userId, requestedDiscount]
        )
        approval = _approval

        // Get admins and create notifications within transaction
        const { rows: _admins } = await client.query(`SELECT id FROM users WHERE role = 'admin'`)
        admins = _admins
        await Promise.all(admins.map((admin: { id: string }) =>
          client.query(
            `INSERT INTO notifications (user_id, type, title, message, entity, entity_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              admin.id,
              'discount_request',
              'Nueva solicitud de descuento',
              `Vendedor solicitó un descuento del ${requestedDiscount}% en "${line?.name ?? 'producto'}".`,
              'discount_approval',
              approval.id,
            ]
          )
        ))

        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }

      broadcastToUsers(
        admins.map((a: { id: string }) => a.id),
        'discount_request',
        {
          approvalId: approval.id,
          quoteId: id,
          quoteNumber: null,
          requesterUsername: session.username,
          quoteLineName: line?.name ?? 'producto',
          quoteLineDisplayType: 'product',
          discountPercent: requestedDiscount,
          createdAt: new Date().toISOString(),
        }
      )
      for (const admin of admins) {
        broadcastToUser(admin.id, 'notification', {
          type: 'discount_request',
          title: 'Nueva solicitud de descuento',
          message: `Vendedor solicitó un descuento del ${requestedDiscount}% en "${line?.name ?? 'producto'}".`,
          entity: 'discount_approval',
          entity_id: approval.id,
          read: false,
          created_at: new Date().toISOString(),
        })
      }

      // updateQuoteTotals is still called but since discount_percent on the line was NOT changed,
      // the product line's subtotal is unchanged and totals remain correct (pending discount excluded).
      await updateQuoteTotals(id)
      revalidatePath('/quotes')
      revalidatePath('/admin/discount-approvals')
      return NextResponse.json({ ok: true })
    }
  }

  // Default flow for non-sales or zero discount
  await updateLine(lineId, body)
  await updateQuoteTotals(id)
  revalidatePath('/quotes')
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; lineId: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id, lineId } = await params
  await deleteLine(lineId)
  await updateQuoteTotals(id)
  revalidatePath('/quotes')
  return NextResponse.json({ ok: true })
}
