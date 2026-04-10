import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { listAllCustomerPayments, createCustomerPayment } from '@/lib/queries/customer-payments'
import { canViewOwnSalesOnly } from '@/lib/permissions'

export async function GET() {
  const session = await getSession()
  if (!session) return unauthorized()

  const ownOnly = canViewOwnSalesOnly(session.role)
  const payments = await listAllCustomerPayments(ownOnly ? session.userId : undefined)
  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const body = await req.json()
  const { customer_id, concept, amount, payment_method, payment_date, reference } = body

  if (!customer_id) return NextResponse.json({ error: 'customer_id requerido' }, { status: 400 })
  if (!amount || Number(amount) <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  if (!payment_method) return NextResponse.json({ error: 'Método de pago requerido' }, { status: 400 })
  if (!payment_date) return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })

  try {
    const payment = await createCustomerPayment({
      customerId: customer_id,
      concept: concept ?? undefined,
      amount: Number(amount),
      paymentMethod: payment_method,
      paymentDate: payment_date,
      reference: reference ?? undefined,
      registeredBy: session.userId,
    })

    revalidatePath('/pagos')
    revalidatePath('/cobranza')
    return NextResponse.json(payment, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
