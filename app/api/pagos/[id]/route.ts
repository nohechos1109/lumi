import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { getCustomerPayment, cancelCustomerPayment, updateCustomerPayment } from '@/lib/queries/customer-payments'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const { id } = await params
  const body = await req.json()

  if (body.amount != null) {
    const amount = Number(body.amount)
    if (!amount || amount <= 0)
      return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  }
  if (body.payment_method !== undefined && !body.payment_method)
    return NextResponse.json({ error: 'Método de pago requerido' }, { status: 400 })
  if (body.payment_date !== undefined && !body.payment_date)
    return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })

  try {
    const updated = await updateCustomerPayment(id, {
      amount: body.amount != null ? Number(body.amount) : undefined,
      paymentMethod: body.payment_method,
      paymentDate: body.payment_date,
      concept: body.concept !== undefined ? (body.concept || null) : undefined,
      reference: body.reference !== undefined ? (body.reference || null) : undefined,
    })
    revalidatePath('/pagos')
    return NextResponse.json(updated)
  } catch (err) {
    const msg = String(err)
    const status = msg.includes('no encontrado') ? 404 : 400
    return NextResponse.json({ error: msg }, { status })
  }
}

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
