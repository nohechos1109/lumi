import Link from 'next/link'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnSalesOnly, canMarkSaleAsPaid } from '@/lib/permissions'
import { getSale } from '@/lib/queries/sales'
import { listNotesBySale } from '@/lib/queries/sale-notes'
import { listPaymentsBySale, listApplicationsBySalePayments } from '@/lib/queries/customer-payments'
import { listScheduleItems } from '@/lib/queries/payment-schedule'
import SaleDetail from './_components/SaleDetail'
import ActivityLog from '@/components/ActivityLog'
import MarkAsPaidButton from './_components/MarkAsPaidButton'

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  const sale = await getSale(id)
  if (!sale) notFound()
  if (canViewOwnSalesOnly(session.role) && sale.user_id !== session.userId) notFound()

  const [notes, payments, schedule, applications] = await Promise.all([
    listNotesBySale(id),
    listPaymentsBySale(id),
    listScheduleItems(id),
    listApplicationsBySalePayments(id),
  ])

  return (
    <div>
      {/* Back navigation */}
      <div className="mb-5">
        <Link
          href="/cobranza"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--c-ghost)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Cobranza
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-7">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Venta</p>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="text-2xl font-bold font-mono"
              style={{ color: 'var(--c-ink)' }}
            >
              {sale.number}
            </h1>
            <SaleBadge state={sale.state} />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 text-sm" style={{ color: 'var(--c-dim)' }}>
            <span className="font-medium" style={{ color: 'var(--c-ink)' }}>{sale.customer_name}</span>
            <span style={{ color: 'var(--c-rim-hi)' }}>·</span>
            <span>{new Date(sale.created_at).toLocaleDateString('es-MX')}</span>

            {sale.quote_number && (
              <>
                <span style={{ color: 'var(--c-rim-hi)' }}>·</span>
                <Link
                  href={`/quotes/${sale.quote_id}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors font-medium text-xs"
                  style={{ background: 'var(--c-navy-bg)', color: 'var(--c-navy)', border: '1px solid var(--c-navy-bd)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  {sale.quote_number}
                </Link>
              </>
            )}

            {sale.project_name && (
              <>
                <span style={{ color: 'var(--c-rim-hi)' }}>·</span>
                <Link
                  href={`/projects/${sale.project_id}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors font-medium text-xs"
                  style={{ background: 'var(--c-navy-bg)', color: 'var(--c-navy)', border: '1px solid var(--c-navy-bd)' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                  {sale.project_name}
                </Link>
              </>
            )}
          </div>
        </div>

        {sale.state === 'paid' && canMarkSaleAsPaid(session.role) && (
          <div className="sm:self-start">
            <MarkAsPaidButton saleId={sale.id} />
          </div>
        )}
      </div>

      {/* Client component handles all interactive sections */}
      <SaleDetail
        sale={sale}
        notes={notes}
        payments={payments}
        schedule={schedule}
        applications={applications}
        role={session.role}
      />

      {(session.role === 'manager' || session.role === 'admin') && (
        <div className="mt-10">
          <ActivityLog entity="sale" entityId={id} />
        </div>
      )}
    </div>
  )
}

function SaleBadge({ state }: { state: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    active:    { bg: '#E0F2FE', text: '#0369A1' },
    paid:      { bg: '#DCFCE7', text: '#15803D' },
    finished:  { bg: '#F0FDF4', text: '#166534' },
    cancelled: { bg: '#FFE4E6', text: '#BE123C' },
  }
  const c = colors[state] ?? colors.active
  const labels: Record<string, string> = { active: 'ACTIVA', paid: 'PAGADA', finished: 'TERMINADA', cancelled: 'CANCELADA' }
  return (
    <span
      className="text-xs font-bold px-3 py-1 rounded-full tracking-wide"
      style={{ background: c.bg, color: c.text }}
    >
      {labels[state] ?? state.toUpperCase()}
    </span>
  )
}
