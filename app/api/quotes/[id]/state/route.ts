import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getQuote, updateQuoteState, QuoteState } from '@/lib/queries/quotes'

const VALID_TRANSITIONS: Record<string, QuoteState[]> = {
  sales:   ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
  manager: ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
  admin:   ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { state } = await req.json()

  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  const allowed = VALID_TRANSITIONS[session.role] ?? []
  if (!allowed.includes(state)) return forbidden()

  await updateQuoteState(id, state)
  return NextResponse.json({ ok: true })
}
