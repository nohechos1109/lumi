'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast, notifyRefresh } from '@/lib/toast'

interface Sale {
  id: string
  number: string
  state: string
  customer_name?: string
  executive_name?: string
  quote_number?: string
  project_name?: string
  amount_total: string
  amount_paid: string
  amount_balance: string
  created_at: string
  archived_at: string | null
}

const STATE_LABELS: Record<string, string> = {
  active: 'Activa',
  paid: 'Pagada',
  cancelled: 'Cancelada',
}

const STATE_COLORS: Record<string, { bg: string; text: string }> = {
  active:    { bg: '#E0F2FE', text: '#0369A1' },
  paid:      { bg: '#DCFCE7', text: '#15803D' },
  cancelled: { bg: '#FFE4E6', text: '#BE123C' },
}

export default function SalesTable({ sales, role }: { sales: Sale[]; role: string }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [stateFilter, setStateFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const archivedCount = useMemo(() => sales.filter(s => s.archived_at !== null).length, [sales])
  const customers = useMemo(() => [...new Set(sales.map(s => s.customer_name).filter(Boolean))].sort(), [sales])

  const filtered = useMemo(() => {
    return sales.filter(s => {
      if (!showArchived && s.archived_at) return false
      if (stateFilter && s.state !== stateFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const match =
          s.number.toLowerCase().includes(q) ||
          (s.customer_name ?? '').toLowerCase().includes(q) ||
          (s.executive_name ?? '').toLowerCase().includes(q) ||
          (s.quote_number ?? '').toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [sales, showArchived, stateFilter, search])

  async function handleArchive(id: string, archive: boolean) {
    setArchivingId(id)
    try {
      const res = await fetch(`/api/sales/${id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive }),
      })
      if (res.ok) {
        toast(archive ? 'Venta archivada' : 'Venta desarchivada')
        notifyRefresh()
        router.refresh()
      }
    } finally {
      setArchivingId(null)
    }
  }

  const fmt = (v: string) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })

  return (
    <div>
      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Buscar por número, cliente, ejecutivo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] text-sm rounded-xl px-4 py-2.5 outline-none transition-shadow focus:ring-2"
          style={{
            background: 'var(--c-card)',
            border: '1px solid var(--c-rim)',
            color: 'var(--c-ink)',
          }}
        />

        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="text-sm rounded-xl px-3 py-2.5"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
        >
          <option value="">Todos los estados</option>
          <option value="active">Activa</option>
          <option value="paid">Pagada</option>
          <option value="cancelled">Cancelada</option>
        </select>

        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs rounded-lg px-3 py-2 transition-colors"
            style={{
              background: showArchived ? 'var(--c-navy-bg)' : 'transparent',
              color: showArchived ? 'var(--c-navy)' : 'var(--c-ghost)',
              border: `1px solid ${showArchived ? 'var(--c-navy-bd)' : 'var(--c-rim)'}`,
            }}
          >
            Archivadas ({archivedCount})
          </button>
        )}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--c-ghost)' }}>
          <p className="text-lg font-medium mb-1">Sin ventas</p>
          <p className="text-sm">Las ventas se generan automáticamente al confirmar una cotización.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--c-rim)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--c-ghost)' }}>Número</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--c-ghost)' }}>Cliente</th>
                <th className="text-left px-4 py-3 font-semibold hidden md:table-cell" style={{ color: 'var(--c-ghost)' }}>Cotización</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--c-ghost)' }}>Total</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--c-ghost)' }}>Pagado</th>
                <th className="text-right px-4 py-3 font-semibold" style={{ color: 'var(--c-ghost)' }}>Saldo</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const colors = STATE_COLORS[s.state] ?? STATE_COLORS.active
                const paidPct = Number(s.amount_total) > 0
                  ? Math.min(100, (Number(s.amount_paid) / Number(s.amount_total)) * 100)
                  : 0

                return (
                  <tr
                    key={s.id}
                    onClick={() => router.push(`/ventas/${s.id}`)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: '1px solid var(--c-rim)',
                      background: s.archived_at ? 'var(--c-panel)' : 'var(--c-card)',
                      opacity: s.archived_at ? 0.6 : 1,
                    }}
                    onMouseEnter={e => { if (!s.archived_at) (e.currentTarget as HTMLElement).style.background = 'var(--c-panel)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = s.archived_at ? 'var(--c-panel)' : 'var(--c-card)' }}
                  >
                    <td className="px-4 py-3 font-mono font-medium" style={{ color: 'var(--c-ink)' }}>{s.number}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--c-dim)' }}>{s.customer_name}</td>
                    <td className="px-4 py-3 hidden md:table-cell font-mono text-xs" style={{ color: 'var(--c-ghost)' }}>{s.quote_number}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {STATE_LABELS[s.state] ?? s.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(s.amount_total)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(s.amount_paid)}</span>
                        {/* Mini progress bar */}
                        <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-rim)' }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${paidPct}%`,
                              background: paidPct >= 100 ? '#15803D' : '#059669',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: Number(s.amount_balance) > 0 ? '#B45309' : '#15803D' }}>
                      ${fmt(s.amount_balance)}
                    </td>
                    <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                      {(role === 'manager' || role === 'admin') && (
                        <button
                          onClick={() => handleArchive(s.id, !s.archived_at)}
                          disabled={archivingId === s.id}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--c-ghost)' }}
                          title={s.archived_at ? 'Desarchivar' : 'Archivar'}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-rim)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          {s.archived_at ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><polyline points="10 14 12 12 14 14"/><line x1="12" y1="12" x2="12" y2="17"/>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
