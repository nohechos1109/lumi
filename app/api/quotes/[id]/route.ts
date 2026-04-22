import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canViewOwnQuotesOnly } from '@/lib/permissions'
import { getQuote, updateQuoteFields, deleteQuote, deleteQuoteCascade } from '@/lib/queries/quotes'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()

  return NextResponse.json(quote)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()

  const force = req.nextUrl.searchParams.get('force') === 'true'
  if (force) {
    await deleteQuoteCascade(id)
  } else {
    await deleteQuote(id)
  }
  revalidatePath('/quotes')
  revalidatePath('/projects')
  return NextResponse.json({ ok: true, cascade: force })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()

  const body = await req.json()
  await updateQuoteFields(id, {
    description: body.description,
    unit_count: body.unit_count ? Number(body.unit_count) : undefined,
    installation_notes: body.installation_notes !== undefined ? (body.installation_notes || null) : undefined,
  })
  revalidatePath('/quotes')
  return NextResponse.json({ ok: true })
}
