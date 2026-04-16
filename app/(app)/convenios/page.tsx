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
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Convenios</p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
          Convenios
        </h1>
        <p className="text-sm mt-1 flex items-center gap-2" style={{ color: 'var(--c-ghost)' }}>
          {items.length} cuota{items.length !== 1 ? 's' : ''}
          {overdueCount > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(220,38,38,0.08)', color: 'var(--c-rose)', border: '1px solid rgba(220,38,38,0.18)' }}>
              {overdueCount} vencida{overdueCount !== 1 ? 's' : ''}
            </span>
          )}
        </p>
      </div>

      <ConveniosTable items={items} customers={customers} />
    </div>
  )
}
