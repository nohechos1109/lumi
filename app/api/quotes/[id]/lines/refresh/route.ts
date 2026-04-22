import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canViewOwnQuotesOnly } from '@/lib/permissions'
import { getQuote, updateQuoteTotals } from '@/lib/queries/quotes'
import { refreshQuoteLines } from '@/lib/queries/quote_lines'
import { broadcastToAll } from '@/lib/sse'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()
  if (quote.state !== 'draft') {
    return NextResponse.json({ error: 'Solo se pueden actualizar precios en cotizaciones en borrador' }, { status: 422 })
  }

  const body = await req.json().catch(() => ({}))
  const all = body?.all === true
  const lineIds: string[] | undefined = Array.isArray(body?.line_ids) ? body.line_ids : undefined
  const mode: 'preserve_manual' | 'use_suggested' =
    body?.mode === 'use_suggested' ? 'use_suggested' : 'preserve_manual'

  if (!all && (!lineIds || lineIds.length === 0)) {
    return NextResponse.json({ error: 'Se requiere line_ids o all=true' }, { status: 400 })
  }

  try {
    const result = await refreshQuoteLines(
      id,
      { all, line_ids: lineIds, mode },
      async (quoteId, client) => {
        await updateQuoteTotals(quoteId, client)
      },
    )
    revalidatePath('/quotes')
    broadcastToAll('quote_lines_refreshed', { quoteId: id })
    return NextResponse.json(result)
  } catch (err) {
    console.error('[POST /api/quotes/[id]/lines/refresh]', err)
    return NextResponse.json({ error: 'Error al actualizar precios' }, { status: 500 })
  }
}
