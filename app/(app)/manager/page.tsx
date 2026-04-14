import { listAllQuotes } from '@/lib/queries/quotes'
import { getSettings } from '@/lib/queries/settings'
import ManagerQuotesTable from './_components/ManagerQuotesTable'

export default async function ManagerPage() {
  const quotes = await listAllQuotes()
  const settings = await getSettings()
  const showMargin = settings?.show_margin ?? true

  const totals = {
    draft:     quotes.filter(q => q.state === 'draft').length,
    sent:      quotes.filter(q => q.state === 'sent').length,
    confirmed: quotes.filter(q => q.state === 'confirmed').length,
  }

  return (
    <div>
      <div className="mb-8">
        <h1
          className="font-heading text-3xl font-bold"
          style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
        >
          Cotizaciones del Equipo
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          {quotes.length} total
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7">
        <div className="rounded-xl p-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 1px 3px rgba(27,52,97,0.05)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--c-ghost)' }}>Borradores</p>
          <p className="font-heading text-3xl font-bold" style={{ color: 'var(--c-gold)' }}>{totals.draft}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 1px 3px rgba(27,52,97,0.05)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--c-ghost)' }}>Enviadas</p>
          <p className="font-heading text-3xl font-bold" style={{ color: 'var(--c-sky)' }}>{totals.sent}</p>
        </div>
        <div className="rounded-xl p-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 1px 3px rgba(27,52,97,0.05)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--c-ghost)' }}>Confirmadas</p>
          <p className="font-heading text-3xl font-bold" style={{ color: 'var(--c-mint)' }}>{totals.confirmed}</p>
        </div>
      </div>

      {/* Table */}
      <ManagerQuotesTable quotes={quotes} showMargin={showMargin} />
    </div>
  )
}
