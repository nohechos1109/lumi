'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { notifyRefresh } from '@/lib/toast'
import { canViewOwnQuotesOnly } from '@/lib/permissions'
import { useSSE } from '@/hooks/useSSE'

interface Quote {
  id: string
  number: string
  state: string
  customer_name?: string
  executive_name?: string
  quotation_date: string | Date
  amount_total: string
  unit_count: number
  description: string | null
  payment_term_name?: string
  archived_at: string | null
  project_id: string | null
}

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Borrador',   cls: 'badge badge-draft' },
  sent:      { label: 'Enviada',    cls: 'badge badge-sent' },
  confirmed: { label: 'Confirmada', cls: 'badge badge-confirmed' },
  cancelled: { label: 'Cancelada',  cls: 'badge badge-cancelled' },
  expired:   { label: 'Expirada',   cls: 'badge badge-expired' },
}

// Normalize a date value (string or Date object) to "YYYY-MM-DD" prefix
function toISOPrefix(val: string | Date): string {
  if (typeof val === 'string') return val.split('T')[0]
  return val.toISOString().split('T')[0]
}

// Format a date value as DD/MM/YYYY
function formatDateStr(val: string | Date): string {
  const [y, m, d] = toISOPrefix(val).split('-')
  return `${d}/${m}/${y}`
}

// Consistent month names to avoid locale-dependent toLocaleString mismatch
const MONTH_NAMES_ES: Record<string, string> = {
  '01': 'enero', '02': 'febrero', '03': 'marzo', '04': 'abril',
  '05': 'mayo', '06': 'junio', '07': 'julio', '08': 'agosto',
  '09': 'septiembre', '10': 'octubre', '11': 'noviembre', '12': 'diciembre',
}

export default function QuotesTable({
  quotes, 
  role, 
  hideCustomer = false, 
  hideDate = false, 
  showDescription = false 
}: { 
  quotes: Quote[]
  role: string
  hideCustomer?: boolean
  hideDate?: boolean
  showDescription?: boolean
}) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const handleQuotesUpdated = useCallback(() => { router.refresh() }, [router])
  useSSE({ quotes_updated: handleQuotesUpdated })
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [executiveFilter, setExecutiveFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const isSales = canViewOwnQuotesOnly(role)

  const archivedCount = useMemo(() => quotes.filter(q => q.archived_at !== null).length, [quotes])

  async function handleArchive(id: string, archive: boolean) {
    setArchivingId(id)
    const res = await fetch(`/api/quotes/${id}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archive }),
    })
    setArchivingId(null)
    if (res.ok) {
      notifyRefresh()
      router.refresh()
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    notifyRefresh()
    setDeleteId(null)
    router.refresh()
  }

  // Pre-calculate unique values for filters (memoized to avoid re-creating Date objects on every render)
  const customers = useMemo(() => Array.from(new Set(quotes.map(q => q.customer_name).filter(Boolean))).sort(), [quotes])
  const executives = useMemo(() => Array.from(new Set(quotes.map(q => q.executive_name).filter(Boolean))).sort(), [quotes])
  const dates = useMemo(() => Array.from(new Set(quotes.map(q => {
    const [y, m] = toISOPrefix(q.quotation_date).split('-')
    return `${y}-${m}`
  }))).sort().reverse(), [quotes])

  const filteredQuotes = quotes.filter(q => {
    const isArchived = q.archived_at !== null
    if (!showArchived && isArchived) return false

    const matchesSearch =
      q.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (q.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    const matchesStatus = statusFilter === '' || q.state === statusFilter
    const matchesCustomer = customerFilter === '' || q.customer_name === customerFilter
    const matchesExecutive = executiveFilter === '' || q.executive_name === executiveFilter
    
    let matchesDate = true
    if (dateFilter) {
      const [y, m] = toISOPrefix(q.quotation_date).split('-')
      matchesDate = `${y}-${m}` === dateFilter
    }

    return matchesSearch && matchesStatus && matchesCustomer && matchesExecutive && matchesDate
  })

  if (quotes.length === 0) {
    return (
      <div
        className="text-center py-24 rounded-xl"
        style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}
      >
        <p className="text-base font-semibold" style={{ color: 'var(--c-dim)' }}>
          Sin cotizaciones
        </p>
        <p className="text-sm mt-1.5" style={{ color: 'var(--c-ghost)' }}>
          Crea tu primera cotización para comenzar.
        </p>
      </div>
    )
  }

  const deleteTarget = quotes.find(q => q.id === deleteId)

  const activeFilterCount = [statusFilter, customerFilter, executiveFilter, dateFilter].filter(Boolean).length
  const hasAnyFilter = searchQuery !== '' || activeFilterCount > 0

  function clearAllFilters() {
    setSearchQuery('')
    setStatusFilter('')
    setCustomerFilter('')
    setExecutiveFilter('')
    setDateFilter('')
  }

  return (
    <>
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 mb-6">

        {/* Search bar — Google-style */}
        <div
          className="relative group"
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            width: '100%',
          }}
        >
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
              placeholder="Buscar por número, cliente o descripción..."
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
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
              style={{
                background: showArchived ? 'var(--c-navy)' : 'var(--c-panel)',
                color: showArchived ? '#fff' : 'var(--c-ghost)',
                border: '1px solid var(--c-rim)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
              {showArchived ? 'Ocultar archivados' : `Archivados (${archivedCount})`}
            </button>
          )}
          {/* Filter icon + label */}
          <div className="flex items-center gap-1.5 mr-1" style={{ color: 'var(--c-ghost)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
            </svg>
          </div>

          {/* Estado */}
          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                background: statusFilter ? 'var(--c-navy-bg)' : 'var(--c-card)',
                border: statusFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
                color: statusFilter ? 'var(--c-navy)' : 'var(--c-dim)',
                boxShadow: statusFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)',
              }}
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

          {/* Cliente */}
          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              style={{
                background: customerFilter ? 'var(--c-navy-bg)' : 'var(--c-card)',
                border: customerFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
                color: customerFilter ? 'var(--c-navy)' : 'var(--c-dim)',
                boxShadow: customerFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)',
              }}
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

          {/* Vendedor */}
          {!isSales && executives.length > 0 && (
            <div className="relative">
              <select
                className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
                value={executiveFilter}
                onChange={(e) => setExecutiveFilter(e.target.value)}
                style={{
                  background: executiveFilter ? 'var(--c-navy-bg)' : 'var(--c-card)',
                  border: executiveFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
                  color: executiveFilter ? 'var(--c-navy)' : 'var(--c-dim)',
                  boxShadow: executiveFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)',
                }}
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
          )}

          {/* Fecha */}
          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                background: dateFilter ? 'var(--c-navy-bg)' : 'var(--c-card)',
                border: dateFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
                color: dateFilter ? 'var(--c-navy)' : 'var(--c-dim)',
                boxShadow: dateFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)',
              }}
            >
              <option value="">Fecha</option>
              {dates.map(d => {
                const [y, m] = d.split('-')
                const dateLabel = `${MONTH_NAMES_ES[m] ?? m} ${y}`
                return <option key={d} value={d}>{dateLabel}</option>
              })}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dateFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          {/* Clear all */}
          {hasAnyFilter && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'var(--c-rose-bg)', color: 'var(--c-rose)', border: '1px solid rgba(209,44,60,0.18)' }}
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
              </svg>
              Limpiar
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold" style={{ background: 'var(--c-rose)', color: '#fff' }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Results count */}
        {hasAnyFilter && (
          <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>
            {filteredQuotes.length} de {quotes.length} {quotes.length === 1 ? 'resultado' : 'resultados'}
          </p>
        )}
      </div>

      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)', boxShadow: '0 1px 4px rgba(27,52,97,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Número</th>
                {!hideCustomer && (
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Cliente</th>
                )}
                {showDescription && (
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Requerimiento</th>
                )}
                {!isSales && (
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Vendedor</th>
                )}
                {!hideDate && (
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Fecha</th>
                )}
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Estado</th>
                <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Total</th>
                <th className="px-5 py-4 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-rim)]">
              {filteredQuotes.map(q => {
                const s = STATE_LABELS[q.state] ?? { label: q.state, cls: 'badge badge-cancelled' }
                return (
                  <tr
                    key={q.id}
                    onClick={() => router.push(`/quotes/${q.id}`)}
                    className="tr-hover transition-colors cursor-pointer"
                    style={{ opacity: q.archived_at ? 0.5 : 1 }}
                  >
                    <td className="px-5 py-4 font-mono text-xs font-bold" style={{ color: 'var(--c-navy)', letterSpacing: '0.08em' }}>
                      <div className="flex flex-col gap-1 items-start">
                        {!q.project_id && (
                          <span className="badge" style={{ fontSize: '0.55rem', padding: '1px 5px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>Mostrador</span>
                        )}
                        <div className="flex items-center gap-2">
                          <span>{q.number}</span>
                          {q.archived_at && (
                            <span className="badge" style={{ background: 'var(--c-panel)', color: 'var(--c-ghost)', border: '1px solid var(--c-rim)', fontSize: '10px' }}>
                              Archivado
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    {!hideCustomer && (
                      <td className="px-5 py-4 font-semibold" style={{ color: 'var(--c-ink)' }}>
                        {q.customer_name}
                      </td>
                    )}
                    {showDescription && (
                      <td className="px-5 py-4 text-xs" style={{ color: 'var(--c-dim)' }}>
                        <span className="line-clamp-1 italic">{q.description || '—'}</span>
                      </td>
                    )}
                    {!isSales && (
                      <td className="px-5 py-4 text-xs font-medium" style={{ color: 'var(--c-dim)' }}>
                        {q.executive_name || '—'}
                      </td>
                    )}
                    {!hideDate && (
                      <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                        {formatDateStr(q.quotation_date)}
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <span className={s.cls}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold" style={{ color: 'var(--c-navy)' }}>
                      ${(Number(q.amount_total) * (q.unit_count ?? 1)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleArchive(q.id, q.archived_at === null) }}
                          disabled={archivingId === q.id}
                          title={q.archived_at ? 'Desarchivar' : 'Archivar'}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: 'var(--c-ghost)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-rim)' }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                        >
                          {q.archived_at ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><polyline points="10 14 12 12 14 14"/><line x1="12" y1="12" x2="12" y2="17"/>
                            </svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                            </svg>
                          )}
                        </button>
                        {!isSales && (
                          <button
                            aria-label="Eliminar cotización"
                            onClick={(e) => { e.stopPropagation(); setDeleteId(q.id) }}
                            className="btn-delete text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
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

      {deleteId && deleteTarget && (
        <ConfirmModal
          message={`¿Eliminar la cotización ${deleteTarget.number}? Se borrarán todas sus líneas. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
