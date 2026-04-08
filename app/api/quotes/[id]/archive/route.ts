import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getQuote, archiveQuote, unarchiveQuote } from '@/lib/queries/quotes'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { archive } = await req.json() as { archive: boolean }

  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  if (archive) {
    await archiveQuote(id)
  } else {
    await unarchiveQuote(id)
  }

  return NextResponse.json({ ok: true })
}
