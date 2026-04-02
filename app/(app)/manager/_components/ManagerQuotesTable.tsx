'use client'

import { useRouter } from 'next/navigation'

interface Quote {
  id: string
  number: string
  state: string
  customer_name?: string
  executive_name?: string
  quotation_date: string
  amount_total: string
  margin_amount: string
}

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Borrador',   cls: 'badge badge-draft' },
  sent:      { label: 'Enviada',    cls: 'badge badge-sent' },
  confirmed: { label: 'Confirmada', cls: 'badge badge-confirmed' },
  cancelled: { label: 'Cancelada',  cls: 'badge badge-cancelled' },
  expired:   { label: 'Expirada',   cls: 'badge badge-expired' },
}

export default function ManagerQuotesTable({ quotes }: { quotes: Quote[] }) {
  const router = useRouter()

  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm"
      style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)', boxShadow: '0 1px 4px rgba(27,52,97,0.06)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Número</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Cliente</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Vendedor</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Fecha</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Estado</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Total</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Margen</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map(q => {
              const s = STATE_LABELS[q.state] ?? { label: q.state, cls: 'badge badge-cancelled' }
              return (
                <tr
                  key={q.id}
                  onClick={() => router.push(`/manager/${q.id}`)}
                  className="tr-hover transition-colors cursor-pointer"
                  style={{ borderTop: '1px solid var(--c-rim)' }}
                >
                  <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--c-dim)', letterSpacing: '0.08em' }}>
                    {q.number}
                  </td>
                  <td className="px-5 py-4" style={{ color: 'var(--c-ink)' }}>{q.customer_name}</td>
                  <td className="px-5 py-4 text-xs font-medium" style={{ color: 'var(--c-dim)' }}>
                    {q.executive_name || '—'}
                  </td>
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
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
