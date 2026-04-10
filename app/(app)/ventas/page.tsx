import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnSalesOnly } from '@/lib/permissions'
import { listAllSales, listSalesByUser } from '@/lib/queries/sales'
import SalesTable from './_components/SalesTable'

export default async function VentasPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  const sales = canViewOwnSalesOnly(session.role)
    ? await listSalesByUser(session.userId)
    : await listAllSales()

  const title = canViewOwnSalesOnly(session.role) ? 'Mis Ventas' : 'Ventas'

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-8">
        <div>
          <h1
            className="font-heading text-3xl font-bold"
            style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
          >
            {title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
            {sales.length} venta{sales.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <SalesTable sales={sales} role={session.role} />
    </div>
  )
}
