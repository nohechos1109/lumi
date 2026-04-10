import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { getSaleNote, updateSaleNoteState } from '@/lib/queries/sale-notes'
import { createCustomerPayment, applyPaymentToNote } from '@/lib/queries/customer-payments'
import { getSale } from '@/lib/queries/sales'
import { listScheduleItems, markScheduleItemPaid } from '@/lib/queries/payment-schedule'
import { insertAuditEvent } from '@/lib/queries/audit'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ noteId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const { noteId } = await params
  const note = await getSaleNote(noteId)
  if (!note) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
  if (note.state === 'cancelled') {
    return NextResponse.json({ error: 'No se puede abonar a una nota cancelada' }, { status: 400 })
  }

  const body = await req.json()
  const amount = Number(body.amount)
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })
  }
  if (!body.payment_method) {
    return NextResponse.json({ error: 'Método de pago requerido' }, { status: 400 })
  }
  if (!body.payment_date) {
    return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
  }

  // Validate overpayment against the note balance
  if (amount > Number(note.amount_balance) + 0.005) {
    return NextResponse.json({
      error: `El monto excede el saldo de la nota ($${Number(note.amount_balance).toFixed(2)})`
    }, { status: 400 })
  }

  // Resolve customer_id from sale
  const sale = await getSale(note.sale_id)
  if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })

  // Auto-confirm the note if it's still draft (so it can receive payments)
  if (note.state === 'draft') {
    await updateSaleNoteState(note.id, 'confirmed')
  }

  let paymentId: string
  try {
    // Create and immediately confirm a customer-level payment
    const payment = await createCustomerPayment({
      customerId: sale.customer_id,
      concept: body.concept ?? undefined,
      amount,
      paymentMethod: body.payment_method,
      paymentDate: body.payment_date,
      registeredBy: session.userId,
    })
    paymentId = payment.id

    // Apply to the note (also updates note & sale totals)
    await applyPaymentToNote(payment.id, note.id, amount, note.sale_id)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  // Auto-mark schedule items as paid (cumulative)
  const updatedSale = await getSale(note.sale_id)
  if (updatedSale) {
    const amountPaid = Number(updatedSale.amount_paid)
    const scheduleItems = await listScheduleItems(note.sale_id)
    let runningSum = 0
    for (const item of scheduleItems) {
      runningSum += Number(item.amount)
      if (item.state === 'pending' && runningSum <= amountPaid + 0.005) {
        await markScheduleItemPaid(item.id)
      }
    }
  }

  // Audit event
  await insertAuditEvent('payment', paymentId, 'payment_applied', {
    sale_id: note.sale_id,
    note_id: note.id,
    amount,
    via: 'cobranza',
    by: session.userId,
  })

  revalidatePath('/cobranza')
  revalidatePath(`/ventas/${note.sale_id}`)
  return NextResponse.json({ ok: true })
}
