'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

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
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [executiveFilter, setExecutiveFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Pre-calculate unique values for filters
  const customers = Array.from(new Set(quotes.map(q => q.customer_name).filter(Boolean))).sort()
  const executives = Array.from(new Set(quotes.map(q => q.executive_name).filter(Boolean))).sort()
  const dates = Array.from(new Set(quotes.map(q => {
    const d = new Date(q.quotation_date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }))).sort().reverse()

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      q.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (q.executive_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    const matchesStatus = statusFilter === '' || q.state === statusFilter
    const matchesCustomer = customerFilter === '' || q.customer_name === customerFilter
    const matchesExecutive = executiveFilter === '' || q.executive_name === executiveFilter
    
    let matchesDate = true
    if (dateFilter) {
      const qDate = new Date(q.quotation_date)
      const filterDate = `${qDate.getFullYear()}-${String(qDate.getMonth() + 1).padStart(2, '0')}`
      matchesDate = filterDate === dateFilter
    }

    return matchesSearch && matchesStatus && matchesCustomer && matchesExecutive && matchesDate
  })

  return (
    <>
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search bar — Google-style */}
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          <div
            className="flex items-center h-12 rounded-full transition-shadow"
            style={{
              background: 'var(--c-card)',
              border: searchQuery ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
              boxShadow: searchQuery
                ? '0 2px 8px rgba(27,52,97,0.12), 0 0 0 3px rgba(27,52,97,0.06)'
                : '0 1px 6px rgba(27,52,97,0.08)',
            }}
          >
            <div className="flex items-center justify-center w-12 shrink-0" style={{ color: searchQuery ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: searchQuery ? 0.85 : 0.5, transition: 'color 0.2s, opacity 0.2s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por número, cliente o vendedor..."
              className="flex-1 h-full bg-transparent outline-none text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ color: 'var(--c-ink)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center justify-center w-10 h-10 mr-1 rounded-full transition-colors"
                style={{ color: 'var(--c-dim)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-rim)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                aria-label="Limpiar búsqueda"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters — pill chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 mr-1" style={{ color: 'var(--c-ghost)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
            </svg>
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: statusFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: statusFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: statusFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: statusFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
            >
              <option value="">Estado</option>
              {Object.entries(STATE_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: statusFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              style={{ background: customerFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: customerFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: customerFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: customerFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
            >
              <option value="">Cliente</option>
              {customers.map(c => (
                <option key={c} value={c!}>{c}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: customerFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={executiveFilter}
              onChange={(e) => setExecutiveFilter(e.target.value)}
              style={{ background: executiveFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: executiveFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: executiveFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: executiveFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
            >
              <option value="">Vendedor</option>
              {executives.map(e => (
                <option key={e} value={e!}>{e}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: executiveFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ background: dateFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: dateFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: dateFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: dateFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
            >
              <option value="">Fecha</option>
              {dates.map(d => {
                const [y, m] = d.split('-')
                const dateLabel = new Date(parseInt(y), parseInt(m) - 1).toLocaleString('es-MX', { month: 'long', year: 'numeric' })
                return <option key={d} value={d}>{dateLabel}</option>
              })}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dateFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>
      </div>

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
            <tbody className="divide-y divide-[var(--c-rim)]">
            {filteredQuotes.map(q => {
              const s = STATE_LABELS[q.state] ?? { label: q.state, cls: 'badge badge-cancelled' }
              return (
                <tr
                  key={q.id}
                  onClick={() => router.push(`/manager/${q.id}`)}
                  className="tr-hover transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4 font-mono text-xs font-bold" style={{ color: 'var(--c-navy)', letterSpacing: '0.08em' }}>
                    {q.number}
                  </td>
                  <td className="px-5 py-4 font-semibold" style={{ color: 'var(--c-ink)' }}>{q.customer_name}</td>
                  <td className="px-5 py-4 text-[11px] font-medium" style={{ color: 'var(--c-dim)' }}>
                    {q.executive_name || '—'}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                    {new Date(q.quotation_date).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-5 py-4">
                    <span className={s.cls}>{s.label}</span>
                  </td>
                  <td className="px-5 py-4 text-right font-mono font-bold" style={{ color: 'var(--c-navy)' }}>
                    ${Number(q.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs font-mono font-bold" style={{ color: Number(q.margin_amount) >= 0 ? 'var(--c-mint)' : 'var(--c-rose)' }}>
                      ${Number(q.margin_amount).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                    </span>
                  </td>
                </tr>
              )
            })}
            {filteredQuotes.length === 0 && (
              <tr>
                <td colSpan={10} className="px-5 py-12 text-center">
                  <p className="text-[var(--c-ghost)] font-mono text-sm uppercase tracking-widest">No se encontraron cotizaciones</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
    </>
  )
}
