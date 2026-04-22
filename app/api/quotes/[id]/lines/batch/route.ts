import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canViewOwnQuotesOnly } from '@/lib/permissions'
import { getQuote, updateQuoteTotals } from '@/lib/queries/quotes'
import { getSettings } from '@/lib/queries/settings'
import { createLine } from '@/lib/queries/quote_lines'
import pool from '@/lib/db'

interface BatchLine {
  product_id: string
  name: string
  qty: number
  discount_percent: number
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()

  const lines: BatchLine[] = await req.json()

  // Fetch fresh product data + current FX
  const productIds = [...new Set(lines.map(l => l.product_id))]
  const [{ rows: products }, settings] = await Promise.all([
    pool.query(`SELECT id, cost_base, utility_fixed, utility_factor, currency FROM products WHERE id = ANY($1)`, [productIds]),
    getSettings(),
  ])
  const productMap = new Map(products.map((p: { id: string; cost_base: string; utility_fixed: string; utility_factor: string; currency: string }) => [p.id, p]))
  const fxRate = Number(settings?.fx_mxn_per_usd ?? 17.85)

  for (const line of lines) {
    const product = productMap.get(line.product_id)
    if (!product) continue
    const fx = product.currency === 'USD' ? fxRate : 1
    const costBase = Number(product.cost_base)
    const utilityFactor = Number(product.utility_factor)
    const utilityFixed = Number(product.utility_fixed)
    const suggested = (costBase * utilityFactor + utilityFixed) * fx
    await createLine({
      quote_id: id,
      display_type: 'product',
      product_id: line.product_id,
      name: line.name,
      qty: line.qty,
      discount_percent: line.discount_percent,
      currency_snapshot: product.currency,
      cost_base_snapshot: costBase,
      utility_fixed_snapshot: utilityFixed,
      utility_factor_snapshot: utilityFactor,
      fx_snapshot: fx,
      unit_price_mxn_suggested: suggested,
    })
  }

  await updateQuoteTotals(id)
  return NextResponse.json({ added: lines.length }, { status: 201 })
}
