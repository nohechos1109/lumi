import Link from 'next/link'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import { getQuote } from '@/lib/queries/quotes'
import LineEditor from './_components/LineEditor'
import QuoteActions from './_components/QuoteActions'
import UnitCountEditor from './_components/UnitCountEditor'
import DescriptionEditor from './_components/DescriptionEditor'
import QuoteStatusEditor from './_components/QuoteStatusEditor'

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const quote = await getQuote(id)

  if (!quote) notFound()
  if (session.role === 'sales' && quote.user_id !== session.userId) notFound()

  return (
    <div>
      {/* Back navigation */}
      <div className="mb-5 flex items-center gap-3">
        <Link 
          href={quote.project_id ? `/projects/${quote.project_id}` : '/quotes'}
          className="text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
          style={{ color: 'var(--c-ghost)' }}
        >
          ← {quote.project_id ? 'Volver al Proyecto' : 'Volver a Mis Cotizaciones'}
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
              {quote.number}
            </h1>
            <QuoteStatusEditor quoteId={id} currentStatus={quote.state} role={session.role} />
          </div>
          
          <div className="flex flex-wrap items-center gap-x-2 text-sm" style={{ color: 'var(--c-dim)' }}>
            <span className="font-medium text-slate-700">{quote.customer_name}</span>
            <span style={{ color: 'var(--c-rim-hi)' }}>|</span>
            <span>{new Date(quote.quotation_date).toLocaleDateString('es-MX')}</span>
            
            {quote.project_id && (
              <>
                <span style={{ color: 'var(--c-rim-hi)' }}>|</span>
                <Link 
                  href={`/projects/${quote.project_id}`}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors font-medium"
                  style={{ color: 'var(--c-navy)' }}
                >
                  📁 {quote.project_name}
                </Link>
              </>
            )}
          </div>
          <DescriptionEditor quoteId={id} description={quote.description} isLocked={quote.state !== 'draft'} />
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
          <UnitCountEditor quoteId={id} unitCount={quote.unit_count} isLocked={quote.state !== 'draft'} />
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

      <LineEditor
        quoteId={id}
        fxSnapshot={Number(quote.fx_mxn_per_usd_snapshot)}
        unitCount={quote.unit_count}
        role={session.role}
        isLocked={quote.state !== 'draft'}
        quoteState={quote.state}
      />
    </div>
  )
}
