import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSession, unauthorized, forbidden } from '@/lib/auth-guard'
import { canApplyPayments } from '@/lib/permissions'
import { confirmCustomerPayment, getCustomerPayment } from '@/lib/queries/customer-payments'
import { autoMarkScheduleItems, listOverdueScheduleItemsBySaleIds } from '@/lib/queries/payment-schedule'
import { listSalesByCustomer } from '@/lib/queries/sales'
import { listUsers } from '@/lib/queries/users'
import { createNotification } from '@/lib/queries/notifications'
import { broadcastToUser, broadcastToAll } from '@/lib/sse'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return unauthorized()
  if (!canApplyPayments(session.role)) return forbidden()

  const { id } = await params

  try {
    await confirmCustomerPayment(id)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }

  // Post-confirmation: auto-mark schedule items + notify overdue
  try {
    const payment = await getCustomerPayment(id)
    if (payment) {
      const sales = await listSalesByCustomer(payment.customer_id)
      const saleIds = sales.map(s => s.id)

      // FIFO auto-mark for all sales of this customer
      await Promise.all(sales.map(s => autoMarkScheduleItems(s.id)))
      broadcastToAll('schedule:updated', {})

      // Detect overdue items across all their sales
      const overdueItems = await listOverdueScheduleItemsBySaleIds(saleIds)

      if (overdueItems.length > 0) {
        // Target: all admins/managers + executives assigned to affected sales
        const allUsers = await listUsers()
        const adminIds = allUsers
          .filter(u => u.role === 'admin' || u.role === 'manager')
          .map(u => u.id)

        const assignedIds = [
          ...new Set(sales.filter(s => s.user_id).map(s => s.user_id!))
        ]

        const targetIds = [...new Set([...adminIds, ...assignedIds])]

        // Group overdue items by sale to send one notification per sale (not per cuota)
        const bySale = new Map<string, typeof overdueItems>()
        for (const item of overdueItems) {
          const list = bySale.get(item.sale_id) ?? []
          list.push(item)
          bySale.set(item.sale_id, list)
        }

        await Promise.all(
          [...bySale.entries()].flatMap(([saleId, saleItems]) => {
            const count = saleItems.length
            const title = `Cuota${count > 1 ? 's' : ''} vencida${count > 1 ? 's' : ''} — ${saleItems[0].sale_number}`
            const message = `${count} pago${count > 1 ? 's' : ''} pendiente${count > 1 ? 's' : ''} vencido${count > 1 ? 's' : ''} en convenio`
            return targetIds.map(async userId => {
              await createNotification({ user_id: userId, type: 'payment_overdue', title, message, entity: 'sale', entity_id: saleId })
              broadcastToUser(userId, 'notification', { type: 'payment_overdue', entity_id: saleId })
            })
          })
        )
      }
    }
  } catch (err) {
    console.error('[confirm] post-processing error:', err)
  }

  revalidatePath('/pagos')
  revalidatePath('/cobranza')
  revalidatePath('/convenios')
  return NextResponse.json({ ok: true })
}
