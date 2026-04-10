import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { getCustomerPayment, cancelCustomerPayment } from '@/lib/queries/customer-payments'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const { id } = await params
  const payment = await getCustomerPayment(id)
  if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
  if (payment.state === 'cancelled') {
    return NextResponse.json({ error: 'El pago ya está cancelado' }, { status: 400 })
  }

  try {
    await cancelCustomerPayment(id)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  revalidatePath('/pagos')
  revalidatePath('/cobranza')
  return NextResponse.json({ ok: true })
}
