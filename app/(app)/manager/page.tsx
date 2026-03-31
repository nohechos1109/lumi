import Link from 'next/link'
import { listAllQuotes } from '@/lib/queries/quotes'

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Borrador',   cls: 'badge badge-draft' },
  sent:      { label: 'Enviada',    cls: 'badge badge-sent' },
  confirmed: { label: 'Confirmada', cls: 'badge badge-confirmed' },
  cancelled: { label: 'Cancelada',  cls: 'badge badge-cancelled' },
  expired:   { label: 'Expirada',   cls: 'badge badge-expired' },
}

export default async function ManagerPage() {
  const quotes = await listAllQuotes()

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
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)', boxShadow: '0 1px 4px rgba(27,52,97,0.06)' }}
      >
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Número</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Cliente</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Fecha</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Estado</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Total</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Margen</th>
              <th className="px-5 py-4 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {quotes.map(q => {
              const s = STATE_LABELS[q.state] ?? { label: q.state, cls: 'badge badge-cancelled' }
              return (
                <tr
                  key={q.id}
                  className="tr-hover transition-colors"
                  style={{ borderTop: '1px solid var(--c-rim)' }}
                >
                  <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--c-dim)', letterSpacing: '0.08em' }}>
                    {q.number}
                  </td>
                  <td className="px-5 py-4" style={{ color: 'var(--c-ink)' }}>{q.customer_name}</td>
                  <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                    {new Date(q.quotation_date).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-5 py-4">
                    <span className={s.cls}>{s.label}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-medium" style={{ color: 'var(--c-ink)' }}>
                    ${Number(q.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs font-mono font-medium" style={{ color: Number(q.margin_amount) >= 0 ? 'var(--c-mint)' : 'var(--c-rose)' }}>
                      ${Number(q.margin_amount).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/manager/${q.id}`}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 whitespace-nowrap"
                      style={{
                        color: 'var(--c-navy)',
                        background: 'var(--c-navy-bg)',
                        border: '1px solid var(--c-navy-bd)',
                      }}
                    >
                      Ver →
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
