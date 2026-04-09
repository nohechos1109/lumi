import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canConfirmPayments } from '@/lib/permissions'
import { getPayment, confirmPayment } from '@/lib/queries/payments'
import { insertAuditEvent } from '@/lib/queries/audit'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canConfirmPayments(session.role)) return forbidden()
  const { id, paymentId } = await params

  const payment = await getPayment(paymentId)
  if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
  if (payment.state !== 'draft') {
    return NextResponse.json({ error: 'Solo se pueden confirmar pagos en borrador' }, { status: 400 })
  }

  await confirmPayment(paymentId, session.userId)
  await insertAuditEvent('payment', paymentId, 'payment_confirmed', {
    sale_id: id,
    by: session.userId,
  })

  revalidatePath(`/ventas/${id}`)
  return NextResponse.json({ ok: true })
}
