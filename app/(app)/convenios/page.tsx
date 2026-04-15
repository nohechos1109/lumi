import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { canManagePaymentSchedule } from '@/lib/permissions'
import { listScheduleItemsGlobal } from '@/lib/queries/payment-schedule'
import { listCustomers } from '@/lib/queries/customers'
import { notFound, redirect } from 'next/navigation'
import ConveniosTable from './_components/ConveniosTable'

export default async function ConveniosPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) redirect('/login')
  if (!canManagePaymentSchedule(session.role)) notFound()

  const [items, customers] = await Promise.all([
    listScheduleItemsGlobal(),
    listCustomers(),
  ])

  const overdueCount = items.filter(i => i.overdue).length

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
        <div>
          <h1
            className="font-heading text-3xl font-bold"
            style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
          >
            Convenios
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
            {items.length} cuota{items.length !== 1 ? 's' : ''}
            {overdueCount > 0 && (
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FFE4E6', color: '#BE123C' }}>
                {overdueCount} vencida{overdueCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
      </div>

      <ConveniosTable items={items} customers={customers} />
    </div>
  )
}
