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
}

const STATE_LABELS: Record<string, { label: string; cls: string }> = {
  draft:     { label: 'Borrador',   cls: 'badge badge-draft' },
  sent:      { label: 'Enviada',    cls: 'badge badge-sent' },
  confirmed: { label: 'Confirmada', cls: 'badge badge-confirmed' },
  cancelled: { label: 'Cancelada',  cls: 'badge badge-cancelled' },
  expired:   { label: 'Expirada',   cls: 'badge badge-expired' },
}

export default function QuotesTable({ quotes, role }: { quotes: Quote[], role: string }) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const isSales = role === 'sales'

  async function handleDelete(id: string) {
    await fetch(`/api/quotes/${id}`, { method: 'DELETE' })
    setDeleteId(null)
    router.refresh()
  }

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
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)', boxShadow: '0 1px 4px rgba(27,52,97,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Número</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Cliente</th>
                {!isSales && (
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Vendedor</th>
                )}
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Fecha</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Estado</th>
                <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Total</th>
                <th className="px-5 py-4 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {quotes.map(q => {
                const s = STATE_LABELS[q.state] ?? { label: q.state, cls: 'badge badge-cancelled' }
                return (
                  <tr
                    key={q.id}
                    onClick={() => router.push(`/quotes/${q.id}`)}
                    className="tr-hover transition-colors cursor-pointer"
                    style={{ borderTop: '1px solid var(--c-rim)' }}
                  >
                    <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--c-dim)', letterSpacing: '0.08em' }}>
                      {q.number}
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-ink)' }}>
                      {q.customer_name}
                    </td>
                    {!isSales && (
                      <td className="px-5 py-4 text-xs font-medium" style={{ color: 'var(--c-dim)' }}>
                        {q.executive_name || '—'}
                      </td>
                    )}
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
