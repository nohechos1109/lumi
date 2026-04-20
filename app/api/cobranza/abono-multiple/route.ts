import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { getSaleNote, updateSaleNoteState } from '@/lib/queries/sale-notes'
import { createCustomerPayment, applyPaymentToNote } from '@/lib/queries/customer-payments'
import { getSale } from '@/lib/queries/sales'
import { listScheduleItems, markScheduleItemPaid } from '@/lib/queries/payment-schedule'
import { insertAuditEvent } from '@/lib/queries/audit'

interface Application {
  noteId: string
  amount: number
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const body = await req.json()
  const customerId: string | undefined = body.customer_id
  const total = Number(body.total)
  const applicationsRaw = Array.isArray(body.applications) ? body.applications : []

  // ── Basic validation ─────────────────────────────────────────────
  if (!customerId) return NextResponse.json({ error: 'customer_id requerido' }, { status: 400 })
  if (!total || total <= 0) return NextResponse.json({ error: 'Monto total inválido' }, { status: 400 })
  if (!body.payment_method) return NextResponse.json({ error: 'Método de pago requerido' }, { status: 400 })
  if (!body.payment_date)   return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
  if (applicationsRaw.length === 0) return NextResponse.json({ error: 'Debes seleccionar al menos una nota' }, { status: 400 })

  // Normalize + filter zero amounts
  const applications: Application[] = applicationsRaw
    .map((a: { noteId?: string; amount?: number }) => ({
      noteId: String(a.noteId ?? ''),
      amount: Number(a.amount ?? 0),
    }))
    .filter((a: Application) => a.noteId && a.amount > 0)

  if (applications.length === 0) {
    return NextResponse.json({ error: 'Al menos una aplicación debe tener monto > 0' }, { status: 400 })
  }

  // Sum must equal total (tolerance 0.01)
  const sum = applications.reduce((s, a) => s + a.amount, 0)
  if (Math.abs(sum - total) > 0.01) {
    return NextResponse.json({
      error: `La suma de los abonos ($${sum.toFixed(2)}) no coincide con el total ($${total.toFixed(2)})`,
    }, { status: 400 })
  }

  // ── Validate all notes belong to the same customer and have balance ─
  const notesChecked = await Promise.all(applications.map(a => getSaleNote(a.noteId)))
  const saleIds: string[] = []

  for (let i = 0; i < applications.length; i++) {
    const note = notesChecked[i]
    const app = applications[i]
    if (!note) return NextResponse.json({ error: `Nota ${app.noteId} no encontrada` }, { status: 404 })

    // Resolve customer_id for this note
    const noteSale = await getSale(note.sale_id)
    if (!noteSale) return NextResponse.json({ error: `Venta de nota ${note.number} no encontrada` }, { status: 404 })
    if (noteSale.customer_id !== customerId) {
      return NextResponse.json({ error: `La nota ${note.number} no pertenece al cliente` }, { status: 400 })
    }

    if (note.state === 'cancelled') {
      return NextResponse.json({ error: `La nota ${note.number} está cancelada` }, { status: 400 })
    }
    if (app.amount > Number(note.amount_balance) + 0.005) {
      return NextResponse.json({
        error: `El abono a ${note.number} ($${app.amount.toFixed(2)}) excede su saldo ($${Number(note.amount_balance).toFixed(2)})`,
      }, { status: 400 })
    }

    saleIds.push(note.sale_id)
  }

  // ── Auto-confirm draft notes that will receive payment ──────────
  for (const note of notesChecked) {
    if (note && note.state === 'draft') {
      await updateSaleNoteState(note.id, 'confirmed')
    }
  }

  // ── Create ONE customer payment and apply it across notes ────────
  let paymentId: string
  try {
    const payment = await createCustomerPayment({
      customerId,
      concept: body.concept ?? undefined,
      amount: total,
      paymentMethod: body.payment_method,
      paymentDate: body.payment_date,
      registeredBy: session.userId,
      confirmed: true,
    })
    paymentId = payment.id

    // Apply sequentially (each application updates note + sale totals)
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i]
      await applyPaymentToNote(payment.id, app.noteId, app.amount, saleIds[i])
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  // ── Auto-mark schedule items as paid per sale (cumulative) ──────
  const uniqueSaleIds = [...new Set(saleIds)]
  for (const saleId of uniqueSaleIds) {
    const updatedSale = await getSale(saleId)
    if (updatedSale) {
      const amountPaid = Number(updatedSale.amount_paid)
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

  // ── Audit ────────────────────────────────────────────────────────
  await insertAuditEvent('payment', paymentId, 'payment_applied', {
    customer_id: customerId,
    applications: applications.map((a, i) => ({ note_id: a.noteId, sale_id: saleIds[i], amount: a.amount })),
    total,
    via: 'cobranza-multi',
    by: session.userId,
  })

  revalidatePath('/cobranza')
  return NextResponse.json({ ok: true })
}
