import { NextRequest, NextResponse } from 'next/server'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { getQuote, duplicateQuote } from '@/lib/queries/quotes'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params

  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (session.role === 'sales' && quote.user_id !== session.userId) return forbidden()

  // Parse body — project_id key presence matters
  let body: Record<string, unknown> = {}
  try {
    body = await req.json()
  } catch {
    // empty body is fine
  }

  // If project_id is explicitly in body, use it (even if null)
  // If not in body, pass undefined so duplicateQuote keeps original
  const targetProjectId = 'project_id' in body
    ? (body.project_id as string | null)
    : undefined

  const targetCustomerId = 'customer_id' in body
    ? (body.customer_id as string | null)
    : undefined

  try {
    const newQuote = await duplicateQuote(id, session.userId, targetProjectId, targetCustomerId)
    return NextResponse.json(newQuote, { status: 201 })
  } catch (error) {
    console.error('POST /api/quotes/[id]/duplicate ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
