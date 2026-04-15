'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { ScheduleItemWithContext } from '@/lib/queries/payment-schedule'
import type { Contact } from '@/lib/queries/customers'
import { fmtMXN, fmtDate } from '@/lib/formatters'
import { useSSE } from '@/hooks/useSSE'

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

const inputClass = 'px-3 py-1.5 rounded-lg text-xs outline-none'
const inputStyle = { background: 'var(--c-card)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', minWidth: 0 }

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

  const set = (k: keyof Filters, v: string) => setFilters(f => ({ ...f, [k]: v }))
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
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <input
          type="text"
          placeholder="Buscar cliente, venta, etiqueta…"
          className={inputClass}
          style={{ ...inputStyle, width: 220 }}
          value={filters.search}
          onChange={e => set('search', e.target.value)}
        />
        <select
          className={inputClass}
          style={inputStyle}
          value={filters.customerId}
          onChange={e => set('customerId', e.target.value)}
        >
          <option value="">Todos los clientes</option>
          {customers.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          className={inputClass}
          style={inputStyle}
          value={filters.estado}
          onChange={e => set('estado', e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="overdue">Vencido</option>
          <option value="pending">Vigente</option>
          <option value="paid">Pagado</option>
        </select>
        <input
          type="date"
          className={inputClass}
          style={inputStyle}
          value={filters.dateFrom}
          onChange={e => set('dateFrom', e.target.value)}
          title="Fecha desde"
        />
        <input
          type="date"
          className={inputClass}
          style={inputStyle}
          value={filters.dateTo}
          onChange={e => set('dateTo', e.target.value)}
          title="Fecha hasta"
        />
        {hasFilters && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY)}
            className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-75"
            style={{ color: 'var(--c-ghost)', border: '1px solid var(--c-rim)' }}
          >
            Limpiar
          </button>
        )}
        <span className="text-xs ml-auto" style={{ color: 'var(--c-ghost)' }}>
          {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 1px 3px rgba(27,52,97,0.05)' }}
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
