import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import { getQuote } from '@/lib/queries/quotes'
import LineEditor from './_components/LineEditor'
import QuoteActions from './_components/QuoteActions'
import UnitCountEditor from './_components/UnitCountEditor'
import DescriptionEditor from './_components/DescriptionEditor'

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const quote = await getQuote(id)

  if (!quote) notFound()
  if (session.role === 'sales' && quote.user_id !== session.userId) notFound()

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-7">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="font-heading text-3xl font-bold"
              style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
            >
              {quote.number}
            </h1>
          </div>
          <p className="text-sm" style={{ color: 'var(--c-dim)' }}>
            <span className="font-medium">{quote.customer_name}</span>
            <span style={{ color: 'var(--c-rim-hi)', margin: '0 0.6rem' }}>|</span>
            {new Date(quote.quotation_date).toLocaleDateString('es-MX')}
          </p>
          <DescriptionEditor quoteId={id} description={quote.description} />
        </div>
        <QuoteActions quoteId={id} currentState={quote.state} role={session.role} />
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 1px 3px rgba(27,52,97,0.05)' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--c-ghost)' }}>
            Vehículos
          </p>
          <UnitCountEditor quoteId={id} unitCount={quote.unit_count} />
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 1px 3px rgba(27,52,97,0.05)' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--c-ghost)' }}>
            Subtotal
          </p>
          <p className="font-mono text-lg font-medium" style={{ color: 'var(--c-ink)' }}>
            ${(Number(quote.amount_untaxed) * quote.unit_count).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 1px 3px rgba(27,52,97,0.05)' }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--c-ghost)' }}>
            IVA (16%)
          </p>
          <p className="font-mono text-lg font-medium" style={{ color: 'var(--c-ink)' }}>
            ${(Number(quote.amount_tax) * quote.unit_count).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Total — highlighted */}
        <div
          className="rounded-xl p-4"
          style={{
            background: 'var(--c-navy)',
            border: '1px solid var(--c-navy)',
            boxShadow: '0 2px 8px rgba(27,52,97,0.18)',
          }}
        >
          <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Total · {quote.unit_count} uds
          </p>
          <p className="font-mono text-xl font-bold" style={{ color: '#FFFFFF' }}>
            ${(Number(quote.amount_total) * quote.unit_count).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <LineEditor quoteId={id} fxSnapshot={Number(quote.fx_mxn_per_usd_snapshot)} unitCount={quote.unit_count} role={session.role} />
    </div>
  )
}
