import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canCancelSale, canMarkSaleAsPaid } from '@/lib/permissions'
import { getSale, updateSaleState } from '@/lib/queries/sales'
import { insertAuditEvent } from '@/lib/queries/audit'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params
  const { state } = await req.json()

  const sale = await getSale(id)
  if (!sale) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (state === 'cancelled') {
    if (!canCancelSale(session.role)) return forbidden()
    if (sale.state !== 'active') {
      return NextResponse.json({ error: 'Solo se pueden cancelar ventas activas' }, { status: 400 })
    }
  } else if (state === 'finished') {
    if (!canMarkSaleAsPaid(session.role)) return forbidden()
    if (sale.state !== 'paid') {
      return NextResponse.json({ error: 'Solo se pueden finalizar ventas pagadas' }, { status: 400 })
    }
  } else {
    return NextResponse.json({ error: 'Transición no válida' }, { status: 400 })
  }

  await updateSaleState(id, state)
  await insertAuditEvent('sale', id, 'state_changed', {
    from: sale.state,
    to: state,
    by: session.userId,
  })

  revalidatePath('/cobranza')
  revalidatePath(`/ventas/${id}`)
  return NextResponse.json({ ok: true })
}
