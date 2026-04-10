import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { applyPaymentToNote } from '@/lib/queries/payments'
import { insertAuditEvent } from '@/lib/queries/audit'
import { getSale } from '@/lib/queries/sales'
import { listScheduleItems, markScheduleItemPaid } from '@/lib/queries/payment-schedule'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()
  const { id, paymentId } = await params

  const body = await req.json()
  if (!body.sale_note_id || !body.amount || Number(body.amount) <= 0) {
    return NextResponse.json({ error: 'Nota y monto requeridos' }, { status: 400 })
  }

  try {
    await applyPaymentToNote(paymentId, body.sale_note_id, Number(body.amount), id)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  // Auto-mark schedule items as paid based on cumulative amount paid
  const updatedSale = await getSale(id)
  if (updatedSale) {
    const amountPaid = Number(updatedSale.amount_paid)
    const scheduleItems = await listScheduleItems(id)
    let runningSum = 0
    for (const item of scheduleItems) {
      runningSum += Number(item.amount)
      if (item.state === 'pending' && runningSum <= amountPaid + 0.005) {
        await markScheduleItemPaid(item.id)
      }
    }
  }

  await insertAuditEvent('payment', paymentId, 'payment_applied', {
    sale_id: id,
    note_id: body.sale_note_id,
    amount: body.amount,
    by: session.userId,
  })

  revalidatePath(`/ventas/${id}`)
  return NextResponse.json({ ok: true })
}
