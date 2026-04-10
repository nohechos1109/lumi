import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { getSale } from '@/lib/queries/sales'
import { createCustomerPayment } from '@/lib/queries/customer-payments'
import { createAnticipo } from '@/lib/queries/anticipos'
import { insertAuditEvent } from '@/lib/queries/audit'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const body = await req.json()
  const saleId: string | undefined        = body.sale_id
  const amount          = Number(body.amount)
  const paymentMethod: string | undefined = body.payment_method
  const paymentDate: string | undefined   = body.payment_date
  const concept: string | undefined       = body.concept || undefined

  if (!saleId)        return NextResponse.json({ error: 'sale_id requerido' },          { status: 400 })
  if (!amount || amount <= 0)
                      return NextResponse.json({ error: 'Monto inválido' },              { status: 400 })
  if (!paymentMethod) return NextResponse.json({ error: 'Método de pago requerido' },   { status: 400 })
  if (!paymentDate)   return NextResponse.json({ error: 'Fecha requerida' },            { status: 400 })

  const sale = await getSale(saleId)
  if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })
  if (sale.state === 'cancelled') {
    return NextResponse.json({ error: 'La venta está cancelada' }, { status: 400 })
  }

  // Create confirmed payment linked to the customer
  const payment = await createCustomerPayment({
    customerId: sale.customer_id,
    concept: concept ?? 'Anticipo',
    amount,
    paymentMethod,
    paymentDate,
    registeredBy: session.userId,
  })

  // Register anticipo record
  const anticipo = await createAnticipo({
    saleId,
    paymentId: payment.id,
    concept,
  })

  await insertAuditEvent('payment', payment.id, 'anticipo_registered', {
    sale_id: saleId,
    anticipo_number: anticipo.number,
    amount,
    payment_method: paymentMethod,
    by: session.userId,
  })

  revalidatePath('/cobranza')
  revalidatePath(`/ventas/${saleId}`)
  return NextResponse.json({ ok: true, anticipo })
}
