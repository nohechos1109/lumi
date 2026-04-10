import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { getSaleNote } from '@/lib/queries/sale-notes'
import { applyPaymentToNote } from '@/lib/queries/customer-payments'
import { getAvailableAnticipoBySale, getTotalAvailableAnticipo } from '@/lib/queries/anticipos'
import { getSale } from '@/lib/queries/sales'
import { listScheduleItems, markScheduleItemPaid } from '@/lib/queries/payment-schedule'
import { insertAuditEvent } from '@/lib/queries/audit'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const body = await req.json()
  const saleId: string | undefined = body.sale_id
  const noteId: string | undefined = body.note_id
  const amount = Number(body.amount)

  if (!saleId) return NextResponse.json({ error: 'sale_id requerido' },   { status: 400 })
  if (!noteId) return NextResponse.json({ error: 'note_id requerido' },   { status: 400 })
  if (!amount || amount <= 0)
    return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

  // Validate note
  const note = await getSaleNote(noteId)
  if (!note) return NextResponse.json({ error: 'Nota no encontrada' },  { status: 404 })
  if (note.sale_id !== saleId)
    return NextResponse.json({ error: 'La nota no pertenece a la venta' }, { status: 400 })
  if (note.state === 'cancelled')
    return NextResponse.json({ error: 'La nota está cancelada' }, { status: 400 })
  if (amount > Number(note.amount_balance) + 0.005)
    return NextResponse.json({
      error: `El monto excede el saldo de la nota ($${Number(note.amount_balance).toFixed(2)})`,
    }, { status: 400 })

  // Validate available anticipo credit
  const totalAvailable = await getTotalAvailableAnticipo(saleId)
  if (amount > totalAvailable + 0.005)
    return NextResponse.json({
      error: `El monto excede el crédito disponible ($${totalAvailable.toFixed(2)})`,
    }, { status: 400 })

  // Apply FIFO from oldest anticipo
  const anticipos = await getAvailableAnticipoBySale(saleId)
  let remaining = amount
  const applied: { payment_id: string; amount: number }[] = []

  try {
    for (const ant of anticipos) {
      if (remaining <= 0.005) break
      const take = Math.min(ant.available, remaining)
      const takeRounded = Math.round(take * 100) / 100
      await applyPaymentToNote(ant.payment_id, noteId, takeRounded, saleId)
      applied.push({ payment_id: ant.payment_id, amount: takeRounded })
      remaining = Math.round((remaining - takeRounded) * 100) / 100
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  // Auto-mark schedule items
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

  await insertAuditEvent('payment', noteId, 'anticipo_applied', {
    sale_id: saleId,
    note_id: noteId,
    amount,
    applied,
    by: session.userId,
  })

  revalidatePath('/cobranza')
  revalidatePath(`/ventas/${saleId}`)
  return NextResponse.json({ ok: true })
}
