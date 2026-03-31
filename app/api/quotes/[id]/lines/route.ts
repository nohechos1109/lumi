import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getQuote, updateQuoteTotals } from '@/lib/queries/quotes'
import { listLines, createLine } from '@/lib/queries/quote_lines'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  const lines = await listLines(id)
  return NextResponse.json(lines)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  const body = await req.json()
  const line = await createLine({ ...body, quote_id: id })
  await updateQuoteTotals(id)
  return NextResponse.json(line, { status: 201 })
}
