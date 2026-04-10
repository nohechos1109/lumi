import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { getSaleNote } from '@/lib/queries/sale-notes'
import { getAvailablePaymentsByCustomer, applyPaymentToNote } from '@/lib/queries/customer-payments'
import { getSale } from '@/lib/queries/sales'
import { insertAuditEvent } from '@/lib/queries/audit'

/**
 * POST /api/cobranza/credit/apply
 * Body: { note_id: string; amount: number }
 *
 * Applies existing customer credit (FIFO by payment age) to a sale note.
 * Does NOT create a new payment — it draws from confirmed, unspent payments.
 */
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const body = await req.json()
  const noteId: string | undefined = body.note_id
  const amount = Number(body.amount)

  if (!noteId) return NextResponse.json({ error: 'note_id requerido' }, { status: 400 })
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

  const note = await getSaleNote(noteId)
  if (!note) return NextResponse.json({ error: 'Nota no encontrada' }, { status: 404 })
  if (note.state === 'cancelled') {
    return NextResponse.json({ error: 'No se puede aplicar crédito a una nota cancelada' }, { status: 400 })
  }
  if (amount > Number(note.amount_balance) + 0.005) {
    return NextResponse.json({
      error: `El monto excede el saldo de la nota ($${Number(note.amount_balance).toFixed(2)})`
    }, { status: 400 })
  }

  const sale = await getSale(note.sale_id)
  if (!sale) return NextResponse.json({ error: 'Venta no encontrada' }, { status: 404 })

  const availablePayments = await getAvailablePaymentsByCustomer(sale.customer_id)
  const totalAvailable = availablePayments.reduce((s, p) => s + p.available, 0)
  if (amount > totalAvailable + 0.005) {
    return NextResponse.json({
      error: `El crédito disponible del cliente ($${totalAvailable.toFixed(2)}) es insuficiente`
    }, { status: 400 })
  }

  // Apply FIFO from oldest confirmed payments
  let remaining = amount
  const appliedFrom: Array<{ paymentId: string; amount: number }> = []
  try {
    for (const pmt of availablePayments) {
      if (remaining <= 0.005) break
      const apply = Math.min(pmt.available, remaining)
      await applyPaymentToNote(pmt.payment_id, noteId, apply, note.sale_id)
      appliedFrom.push({ paymentId: pmt.payment_id, amount: apply })
      remaining = Math.round((remaining - apply) * 100) / 100
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  await insertAuditEvent('sale_note', noteId, 'credit_applied', {
    note_id: noteId,
    sale_id: note.sale_id,
    customer_id: sale.customer_id,
    amount,
    applied_from: appliedFrom,
    by: session.userId,
  })

  revalidatePath('/cobranza')
  revalidatePath(`/ventas/${note.sale_id}`)
  return NextResponse.json({ ok: true })
}
