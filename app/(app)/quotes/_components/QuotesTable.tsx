'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Quote {
  id: string
  number: string
  state: string
  customer_name?: string
  executive_name?: string
  quotation_date: string
  amount_total: string
  description: string | null
  payment_term_name?: string
}

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Borrador',   cls: 'badge badge-draft' },
  sent:      { label: 'Enviada',    cls: 'badge badge-sent' },
  confirmed: { label: 'Confirmada', cls: 'badge badge-confirmed' },
  cancelled: { label: 'Cancelada',  cls: 'badge badge-cancelled' },
  expired:   { label: 'Expirada',   cls: 'badge badge-expired' },
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
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const isSales = role === 'sales'

  async function handleDelete(id: string) {
    await fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    router.refresh()
  }

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      q.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    const matchesStatus = statusFilter === '' || q.state === statusFilter

    return matchesSearch && matchesStatus
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

  return (
    <>
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-xl shadow-sm" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            className="w-full pl-11 pr-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[var(--c-sky)] transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              background: 'var(--c-base)', 
              border: '1px solid var(--c-rim)',
              color: 'var(--c-ink)'
            }}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-ghost)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>
        
        <div className="relative min-w-[200px]">
          <select
            className="w-full appearance-none px-4 py-2.5 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-[var(--c-sky)] transition-all cursor-pointer text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ 
              background: 'var(--c-base)', 
              border: '1px solid var(--c-rim)',
              color: 'var(--c-ink)'
            }}
          >
            <option value="">Todos los estados</option>
            {Object.entries(STATE_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--c-ghost)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </div>
        </div>
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
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Descripción</th>
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
                  >
                    <td className="px-5 py-4 font-mono text-xs font-bold" style={{ color: 'var(--c-navy)', letterSpacing: '0.08em' }}>
                      {q.number}
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
                        {new Date(q.quotation_date).toLocaleDateString('es-MX')}
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <span className={s.cls}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-bold" style={{ color: 'var(--c-navy)' }}>
                      ${Number(q.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          aria-label="Eliminar cotización"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(q.id) }}
                          className="btn-delete text-xs"
                        >
                          ✕
                        </button>
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
