'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ScheduleItemWithContext } from '@/lib/queries/payment-schedule'
import type { Contact } from '@/lib/queries/customers'
import { fmtMXN, fmtDate } from '@/lib/formatters'
import { useSSE } from '@/hooks/useSSE'
import FilterSelect from '@/components/ui/FilterSelect'
import DateRangePicker from '@/app/(app)/cobranza/_components/DateRangePicker'

interface Props {
  items: ScheduleItemWithContext[]
  customers: Contact[]
}

interface Filters {
  search: string
  customerId: string
  estado: string
  dateFrom: string
  dateTo: string
}

const EMPTY: Filters = { search: '', customerId: '', estado: '', dateFrom: '', dateTo: '' }

function StateBadge({ state, overdue }: { state: string; overdue: boolean }) {
  if (state === 'paid') {
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#DCFCE7', color: '#15803D' }}>Pagado</span>
  }
  if (overdue) {
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#FFE4E6', color: '#BE123C' }}>Vencido</span>
  }
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: '#E0F2FE', color: '#0369A1' }}>Vigente</span>
}

export default function ConveniosTable({ items, customers }: Props) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(EMPTY)

  useSSE({ 'schedule:updated': () => router.refresh() })

  const set = useCallback((k: keyof Filters, v: string) => setFilters(f => ({ ...f, [k]: v })), [])
  const hasFilters = Object.values(filters).some(Boolean)

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const match =
          item.customer_name.toLowerCase().includes(q) ||
          item.sale_number.toLowerCase().includes(q) ||
          (item.label ?? '').toLowerCase().includes(q)
        if (!match) return false
      }
      if (filters.customerId && item.customer_id !== filters.customerId) return false
      if (filters.estado) {
        if (filters.estado === 'paid' && item.state !== 'paid') return false
        if (filters.estado === 'overdue' && !item.overdue) return false
        if (filters.estado === 'pending' && (item.state !== 'pending' || item.overdue)) return false
      }
      if (filters.dateFrom && item.due_date < filters.dateFrom) return false
      if (filters.dateTo && item.due_date > filters.dateTo) return false
      return true
    })
  }, [items, filters])

  return (
    <div className="flex flex-col gap-4">
      {/* Filter bar */}
      <div className="flex flex-col gap-4 mb-2">
        {/* Search */}
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          <div className="flex items-center h-12 rounded-full transition-shadow"
            style={{
              background: 'var(--c-card)',
              border: filters.search ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
              boxShadow: filters.search ? '0 2px 8px rgba(37,99,235,0.10), 0 0 0 3px rgba(37,99,235,0.06)' : '0 1px 4px rgba(15,23,42,0.06)',
            }}>
            <div className="flex items-center justify-center w-12 shrink-0" style={{ color: filters.search ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: filters.search ? 0.85 : 0.5 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input type="text" placeholder="Buscar cliente, venta, etiqueta…" className="flex-1 h-full bg-transparent outline-none text-sm font-medium"
              value={filters.search} onChange={e => set('search', e.target.value)} style={{ color: 'var(--c-ink)' }} />
            {filters.search && (
              <button onClick={() => set('search', '')} className="flex items-center justify-center w-10 h-10 mr-1 rounded-full transition-colors"
                style={{ color: 'var(--c-dim)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--c-rim)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center" style={{ color: 'var(--c-ghost)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
            </svg>
          </div>
          <DateRangePicker
            dateFrom={filters.dateFrom} dateTo={filters.dateTo}
            onChange={(from, to) => { set('dateFrom', from); set('dateTo', to) }}
          />
          <FilterSelect
            value={filters.customerId} onChange={v => set('customerId', v)}
            placeholder="Cliente"
            options={customers.map(c => ({ value: c.id, label: c.name }))}
          />
          <FilterSelect
            value={filters.estado} onChange={v => set('estado', v)}
            placeholder="Estado"
            options={[
              { value: 'overdue', label: 'Vencido' },
              { value: 'pending', label: 'Vigente' },
              { value: 'paid',    label: 'Pagado'  },
            ]}
          />
          {hasFilters && (
            <button onClick={() => setFilters(EMPTY)}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'var(--c-rose-bg)', color: 'var(--c-rose)', border: '1px solid rgba(209,44,60,0.18)' }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
              </svg>
              Limpiar
            </button>
          )}
          <span className="text-xs font-medium tabular-nums ml-auto" style={{ color: 'var(--c-ghost)' }}>
            {filtered.length}/{items.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
      >
        {filtered.length === 0 ? (
          <p className="text-sm py-12 text-center" style={{ color: 'var(--c-ghost)' }}>Sin resultados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Cliente</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Venta</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Etiqueta</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Fecha límite</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Importe</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Estado</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-xs uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Retraso</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--c-rim)' }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: 'var(--c-ink)' }}>
                      {item.customer_name}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/ventas/${item.sale_id}`}
                        className="font-mono text-xs font-semibold hover:underline"
                        style={{ color: 'var(--c-navy)' }}
                      >
                        {item.sale_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--c-dim)' }}>
                      {item.label || '—'}
                    </td>
                    <td
                      className="px-4 py-3 font-mono text-xs"
                      style={{ color: item.overdue ? '#BE123C' : 'var(--c-ink)' }}
                    >
                      {fmtDate(item.due_date)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>
                      ${fmtMXN(item.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StateBadge state={item.state} overdue={item.overdue} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs" style={{ color: '#BE123C' }}>
                      {item.days_overdue != null ? `${item.days_overdue}d` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
