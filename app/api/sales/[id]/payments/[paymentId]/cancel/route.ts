import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canCancelPayments } from '@/lib/permissions'
import { getPayment, cancelPayment } from '@/lib/queries/payments'
import { insertAuditEvent } from '@/lib/queries/audit'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canCancelPayments(session.role)) return forbidden()
  const { id, paymentId } = await params

  const payment = await getPayment(paymentId)
  if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
  if (payment.state === 'cancelled') {
    return NextResponse.json({ error: 'El pago ya está cancelado' }, { status: 400 })
  }

  await cancelPayment(paymentId, id)
  await insertAuditEvent('payment', paymentId, 'payment_cancelled', {
    sale_id: id,
    by: session.userId,
  })

  revalidatePath(`/ventas/${id}`)
  return NextResponse.json({ ok: true })
}
