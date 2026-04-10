import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canRegisterPayments } from '@/lib/permissions'
import { getSale } from '@/lib/queries/sales'
import { listPaymentsBySale, createPayment } from '@/lib/queries/payments'
import { insertAuditEvent } from '@/lib/queries/audit'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  const { id } = await params

  const payments = await listPaymentsBySale(id)
  return NextResponse.json(payments)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canRegisterPayments(session.role)) return forbidden()
  const { id } = await params

  const sale = await getSale(id)
  if (!sale) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  if (sale.state !== 'active') {
    return NextResponse.json({ error: 'La venta no está activa' }, { status: 400 })
  }

  const body = await req.json()

  if (!body.amount || Number(body.amount) <= 0) {
    return NextResponse.json({ error: 'El importe debe ser mayor a 0' }, { status: 400 })
  }
  if (!body.payment_method) {
    return NextResponse.json({ error: 'Método de pago requerido' }, { status: 400 })
  }

  const payment = await createPayment({
    saleId: id,
    concept: body.concept,
    amount: Number(body.amount),
    paymentMethod: body.payment_method,
    paymentDate: body.payment_date ?? new Date().toISOString().slice(0, 10),
    reference: body.reference,
    notes: body.notes,
    registeredBy: session.userId,
  })

  await insertAuditEvent('payment', payment.id, 'payment_registered', {
    sale_id: id,
    amount: body.amount,
    by: session.userId,
  })

  revalidatePath(`/ventas/${id}`)
  return NextResponse.json(payment, { status: 201 })
}
