import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnSalesOnly } from '@/lib/permissions'
import { listAllCustomerPayments } from '@/lib/queries/customer-payments'
import { listCustomers } from '@/lib/queries/customers'
import PagosTable from './_components/PagosTable'

export default async function PagosPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const ownOnly = canViewOwnSalesOnly(session.role)

  const [payments, customers] = await Promise.all([
    listAllCustomerPayments(ownOnly ? session.userId : undefined),
    listCustomers(),
  ])

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Pagos</p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
          Pagos
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          {payments.length} pago{payments.length !== 1 ? 's' : ''}
        </p>
      </div>

      <PagosTable
        payments={payments}
        customers={customers}
        role={session.role}
      />
    </div>
  )
}
