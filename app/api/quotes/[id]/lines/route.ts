import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canViewOwnQuotesOnly, canRequestDiscounts } from '@/lib/permissions'
import { getQuote, updateQuoteTotals } from '@/lib/queries/quotes'
import { listLines, createLine } from '@/lib/queries/quote_lines'
import { getSettings } from '@/lib/queries/settings'
import pool from '@/lib/db'
import { createDiscountApproval } from '@/lib/queries/discount-approvals'
import { createNotification } from '@/lib/queries/notifications'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()

  const lines = await listLines(id)
  return NextResponse.json(lines)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()

  const body = await req.json()

  // For product lines: fetch fresh product data + FX from DB, ignore client-sent prices
  if (body.display_type === 'product' && body.product_id) {
    const [{ rows: [product] }, settings] = await Promise.all([
      pool.query(`SELECT cost_base, utility_fixed, utility_factor, currency FROM products WHERE id = $1`, [body.product_id]),
      getSettings(),
    ])
    if (!product) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    const fxRate = Number(settings?.fx_mxn_per_usd ?? 17.85)
    const fx = product.currency === 'USD' ? fxRate : 1
    const suggested = (Number(product.cost_base) * Number(product.utility_factor) + Number(product.utility_fixed)) * fx
    body.currency_snapshot = product.currency
    body.cost_base_snapshot = Number(product.cost_base)
    body.utility_fixed_snapshot = Number(product.utility_fixed)
    body.utility_factor_snapshot = Number(product.utility_factor)
    body.fx_snapshot = fx
    body.unit_price_mxn_suggested = suggested
    body.unit_price_mxn_manual = null
  }

  if (body.display_type === 'discount') {
    const { rows: [{ count }] } = await pool.query(
      `SELECT COUNT(*) FROM quote_lines WHERE quote_id = $1 AND display_type = 'discount'`,
      [id]
    )
    if (Number(count) >= 1)
      return NextResponse.json({ error: 'Ya existe un descuento global en esta cotización' }, { status: 400 })
  }

  const line = await createLine({ ...body, quote_id: id })

  if (body.display_type === 'discount' && canRequestDiscounts(session.role)) {
    // Mark as pending instead of directly active
    await pool.query(
      `UPDATE quote_lines SET discount_approval_status = 'pending' WHERE id = $1`,
      [line.id]
    )
    const { rows: [updatedLine] } = await pool.query(
      `SELECT * FROM quote_lines WHERE id = $1`,
      [line.id]
    )

    // Create approval request
    const discountApproval = await createDiscountApproval({
      quote_id: id,
      quote_line_id: line.id,
      requested_by: session.userId,
      discount_percent: Number(body.discount_percent ?? 0),
    })

    // Notify all admins
    const { rows: admins } = await pool.query(
      `SELECT id FROM users WHERE role = 'admin'`
    )
    await Promise.all(admins.map((admin: { id: string }) =>
      createNotification({
        user_id: admin.id,
        type: 'discount_request',
        title: 'Nueva solicitud de descuento',
        message: `Vendedor solicitó un descuento del ${body.discount_percent}% para la cotización.`,
        entity: 'discount_approval',
        entity_id: discountApproval.id,
      })
    ))

    // Don't recalculate totals for pending discounts
    return NextResponse.json(updatedLine, { status: 201 })
  }

  // Original flow: recalculate totals
  await updateQuoteTotals(id)
  return NextResponse.json(line, { status: 201 })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id: quoteId } = await params
  const quote = await getQuote(quoteId)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()
  if (quote.state !== 'draft') return NextResponse.json({ error: 'Solo se pueden limpiar cotizaciones en borrador' }, { status: 422 })

  await pool.query('DELETE FROM quote_lines WHERE quote_id = $1', [quoteId])
  await updateQuoteTotals(quoteId)
  return NextResponse.json({ ok: true })
}
