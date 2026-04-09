import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized } from '@/lib/auth-guard'
import { canViewOwnQuotesOnly, canAccessShowroomQuotes } from '@/lib/permissions'
import { listQuotesByUser, listAllQuotes, createQuote } from '@/lib/queries/quotes'
import { getSettings } from '@/lib/queries/settings'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const quotes = canViewOwnQuotesOnly(session.role)
    ? await listQuotesByUser(session.userId)
    : await listAllQuotes()

  return NextResponse.json(quotes)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()

  const body = await req.json()

  if (!canAccessShowroomQuotes(session.role) && !body.project_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const settings = await getSettings()

  try {
    const quote = await createQuote({
      customer_id: body.customer_id,
      payment_term_id: body.payment_term_id,
      quotation_date: body.quotation_date ?? new Date().toISOString(),
      expiration_date: body.expiration_date ?? (() => {
        const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString()
      })(),
      fx_mxn_per_usd_snapshot: Number(settings?.fx_mxn_per_usd ?? 17.85),
      description: body.description,
      unit_count: body.unit_count ? Number(body.unit_count) : 1,
      terms: body.terms,
      user_id: session.userId,
      project_id: body.project_id,
    })

    revalidatePath('/quotes')
    revalidatePath('/projects')
    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('POST /api/quotes ERROR:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
