import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canViewOwnQuotesOnly } from '@/lib/permissions'
import { getQuote, updateQuoteState, QuoteState } from '@/lib/queries/quotes'
import { insertAuditEvent } from '@/lib/queries/audit'
import { getSaleByQuote, createSaleFromQuote } from '@/lib/queries/sales'
import { createNotification } from '@/lib/queries/notifications'

const VALID_TRANSITIONS: Record<string, QuoteState[]> = {
  sales:   ['sent', 'cancelled'],
  almacen: ['sent', 'cancelled'],
  soporte: ['sent', 'cancelled'],
  manager: ['confirmed', 'cancelled'],
  admin:   ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return unauthorized()

  const { id } = await params
  const { state } = await req.json()

  const quote = await getQuote(id)
  if (!quote) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (canViewOwnQuotesOnly(session.role) && quote.user_id !== session.userId) return forbidden()

  const allowed = VALID_TRANSITIONS[session.role] ?? []
  if (!allowed.includes(state)) return forbidden()

  await updateQuoteState(id, state)
  await insertAuditEvent('quote', id, 'status_change', {
    from: quote.state,
    to: state,
    user_id: session.userId,
    username: session.username,
  })

  // Auto-create sale when quote is confirmed
  if (state === 'confirmed') {
    try {
      const existingSale = await getSaleByQuote(id)
      if (!existingSale) {
        const sale = await createSaleFromQuote(id, session.userId)
        if (quote.user_id) {
          await createNotification({
            user_id: quote.user_id,
            type: 'sale_created',
            title: `Venta ${sale.number} creada`,
            message: `Se generó la venta para la cotización ${quote.number}`,
            entity: 'sale',
            entity_id: sale.id,
          })
        }
        revalidatePath('/ventas')
      }
    } catch (err) {
      console.error('Error creating sale from quote:', err)
      // Don't fail the quote state change if sale creation fails
    }
  }

  revalidatePath('/quotes')
  return NextResponse.json({ ok: true })
}
