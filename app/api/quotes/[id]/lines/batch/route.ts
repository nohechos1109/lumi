import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canViewOwnQuotesOnly } from '@/lib/permissions'
import { getQuote, updateQuoteTotals } from '@/lib/queries/quotes'
import { createLine } from '@/lib/queries/quote_lines'

interface BatchLine {
  product_id: string
  name: string
  qty: number
  discount_percent: number
  currency: string
  cost_base: number
  utility_fixed: number
  utility_factor: number
  fx_snapshot: number
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()

  const lines: BatchLine[] = await req.json()

  for (const line of lines) {
    const fx = line.currency === 'USD' ? (Number(line.fx_snapshot) || 1) : 1
    const costBase = Number(line.cost_base) || 0
    const utilityFactor = Number(line.utility_factor) || 0
    const utilityFixed = Number(line.utility_fixed) || 0
    const suggested = (costBase * utilityFactor + utilityFixed) * fx
    await createLine({
      quote_id: id,
      display_type: 'product',
      product_id: line.product_id,
      name: line.name,
      qty: line.qty,
      discount_percent: line.discount_percent,
      currency_snapshot: line.currency,
      cost_base_snapshot: line.cost_base,
      utility_fixed_snapshot: line.utility_fixed,
      utility_factor_snapshot: line.utility_factor,
      fx_snapshot: fx,
      unit_price_mxn_suggested: suggested,
    })
  }

  await updateQuoteTotals(id)
  return NextResponse.json({ added: lines.length }, { status: 201 })
}
