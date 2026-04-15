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
          className="text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
          style={{ color: 'var(--c-ghost)' }}
        >
          ← Volver a Cobranza
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-7">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-1">
            <h1
              className="font-heading text-3xl font-bold"
              style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
            >
              {sale.number}
            </h1>
            <SaleBadge state={sale.state} />
          </div>

          <div className="flex flex-wrap items-center gap-x-2 text-sm" style={{ color: 'var(--c-dim)' }}>
            <span className="font-medium text-slate-700">{sale.customer_name}</span>
            <span style={{ color: 'var(--c-rim-hi)' }}>|</span>
            <span>{new Date(sale.created_at).toLocaleDateString('es-MX')}</span>

            {sale.quote_number && (
              <>
                <span style={{ color: 'var(--c-rim-hi)' }}>|</span>
                <Link
                  href={`/quotes/${sale.quote_id}`}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors font-medium"
                  style={{ color: 'var(--c-navy)' }}
                >
                  📋 {sale.quote_number}
                </Link>
              </>
            )}

            {sale.project_name && (
              <>
                <span style={{ color: 'var(--c-rim-hi)' }}>|</span>
                <Link
                  href={`/projects/${sale.project_id}`}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors font-medium"
                  style={{ color: 'var(--c-navy)' }}
                >
                  📁 {sale.project_name}
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
