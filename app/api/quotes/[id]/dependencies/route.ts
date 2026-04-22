import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canViewOwnQuotesOnly } from '@/lib/permissions'
import { getQuote, getQuoteDependencies } from '@/lib/queries/quotes'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()
  const deps = await getQuoteDependencies(id)
  return NextResponse.json(deps)
}
