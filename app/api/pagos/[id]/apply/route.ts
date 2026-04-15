import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { getCustomerPayment, applyPaymentToNote } from '@/lib/queries/customer-payments'
import { getSaleNote, updateSaleNoteState } from '@/lib/queries/sale-notes'
import { getSale } from '@/lib/queries/sales'
import { listScheduleItems, markScheduleItemPaid } from '@/lib/queries/payment-schedule'
import { insertAuditEvent } from '@/lib/queries/audit'

interface Application {
  note_id: string
  amount: number
}

/**
 * POST /api/pagos/[id]/apply
 * Body: { applications: [{ note_id, amount }] }
 *
 * Applies an existing confirmed payment to one or more notes.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const { id } = await params
  const payment = await getCustomerPayment(id)
  if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
  if (payment.state !== 'confirmed') {
    return NextResponse.json({ error: 'El pago debe estar confirmado' }, { status: 400 })
  }

  const body = await req.json()
  const applicationsRaw: Application[] = Array.isArray(body.applications) ? body.applications : []
  const applications = applicationsRaw
    .map(a => ({ note_id: String(a.note_id ?? ''), amount: Number(a.amount ?? 0) }))
    .filter(a => a.note_id && a.amount > 0.005)

  if (applications.length === 0) {
    return NextResponse.json({ error: 'Debes asignar monto a al menos una nota' }, { status: 400 })
  }

  const totalToApply = applications.reduce((s, a) => s + a.amount, 0)
  const available = Number(payment.amount_available ?? 0)
  if (totalToApply > available + 0.005) {
    return NextResponse.json({
      error: `El total a aplicar ($${totalToApply.toFixed(2)}) supera el saldo disponible ($${available.toFixed(2)})`
    }, { status: 400 })
  }

  // Validate each note belongs to the customer and has enough balance
  const notes = await Promise.all(applications.map(a => getSaleNote(a.note_id)))
  const saleIds: string[] = []

  for (let i = 0; i < applications.length; i++) {
    const note = notes[i]
    const app  = applications[i]
    if (!note) return NextResponse.json({ error: `Nota ${app.note_id} no encontrada` }, { status: 404 })
    if (note.state === 'cancelled') {
      return NextResponse.json({ error: `La nota ${note.number} está cancelada` }, { status: 400 })
    }
    if (note.state === 'draft') {
      return NextResponse.json({ error: `La nota ${note.number} está en borrador` }, { status: 400 })
    }
    const sale = await getSale(note.sale_id)
    if (!sale || sale.customer_id !== payment.customer_id) {
      return NextResponse.json({ error: `La nota ${note.number} no pertenece al cliente` }, { status: 400 })
    }
    if (app.amount > Number(note.amount_balance) + 0.005) {
      return NextResponse.json({
        error: `El monto para ${note.number} excede su saldo ($${Number(note.amount_balance).toFixed(2)})`
      }, { status: 400 })
    }
    saleIds.push(note.sale_id)
  }

  try {
    for (let i = 0; i < applications.length; i++) {
      await applyPaymentToNote(id, applications[i].note_id, applications[i].amount, saleIds[i])
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  // Auto-mark schedule items per sale
  const uniqueSaleIds = [...new Set(saleIds)]
  for (const saleId of uniqueSaleIds) {
    const updatedSale = await getSale(saleId)
    if (updatedSale) {
      const amountPaid   = Number(updatedSale.amount_paid)
      const scheduleItems = await listScheduleItems(saleId)
      let runningSum = 0
      for (const item of scheduleItems) {
        runningSum += Number(item.amount)
        if (item.state === 'pending' && runningSum <= amountPaid + 0.005) {
          await markScheduleItemPaid(item.id)
        }
      }
    }
  }

  await insertAuditEvent('payment', id, 'payment_applied', {
    applications: applications.map((a, i) => ({ note_id: a.note_id, sale_id: saleIds[i], amount: a.amount })),
    total: totalToApply,
    via: 'pagos-apply',
    by: session.userId,
  })

  revalidatePath('/pagos')
  revalidatePath('/cobranza')
  return NextResponse.json({ ok: true })
}
