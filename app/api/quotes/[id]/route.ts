import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getQuote, updateQuoteFields, deleteQuote } from '@/lib/queries/quotes'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  return NextResponse.json(quote)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  await deleteQuote(id)
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  const body = await req.json()
  await updateQuoteFields(id, {
    description: body.description,
    unit_count: body.unit_count ? Number(body.unit_count) : undefined,
  })
  return NextResponse.json({ ok: true })
}
