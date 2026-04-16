'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast, notifyRefresh } from '@/lib/toast'
import { useSSE } from '@/hooks/useSSE'

interface DiscountApproval {
  id: string
  quote_id: string
  quote_number: string
  requester_username: string
  quote_line_name: string
  quote_line_display_type: string | null
  discount_percent: string
  created_at: string
}

export default function DiscountApprovalsClient() {
  const [approvals, setApprovals] = useState<DiscountApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const router = useRouter()

  async function loadApprovals() {
    try {
      const r = await fetch('/api/discount-approvals')
      if (!r.ok) throw new Error()
      setApprovals(await r.json())
    } catch {
      toast('Error al cargar las solicitudes', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Load on mount
  useEffect(() => { loadApprovals() }, [])

  useSSE({
    discount_request: (data) => {
      const d = data as {
        approvalId: string; quoteId: string; quoteNumber: string | null
        requesterUsername: string; quoteLineName: string; quoteLineDisplayType: string | null
        discountPercent: number; createdAt: string
      }
      setApprovals(prev => [{
        id: d.approvalId,
        quote_id: d.quoteId,
        quote_number: d.quoteNumber ?? '—',
        requester_username: d.requesterUsername,
        quote_line_name: d.quoteLineName,
        quote_line_display_type: d.quoteLineDisplayType,
        discount_percent: String(d.discountPercent),
        created_at: d.createdAt,
      }, ...prev])
    },
    approval_cancelled: (data) => {
      const { approvalId } = data as { approvalId: string }
      setApprovals(prev => prev.filter(a => a.id !== approvalId))
    },
    discount_decision: (data) => {
      const { approvalId } = data as { approvalId: string }
      setApprovals(prev => prev.filter(a => a.id !== approvalId))
    },
  })

  // Also reload immediately when any mutation event fires (same session)
  useEffect(() => {
    window.addEventListener('app:refresh-notifications', loadApprovals)
    return () => window.removeEventListener('app:refresh-notifications', loadApprovals)
  }, [])

  async function decide(id: string, decision: 'approved' | 'rejected') {
    setProcessing(id)
    try {
      const r = await fetch(`/api/discount-approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision }),
      })
      if (!r.ok) throw new Error()
      notifyRefresh()
      setApprovals(prev => prev.filter(a => a.id !== id))
      toast(decision === 'approved' ? 'Descuento aprobado' : 'Descuento rechazado')
      router.refresh()
    } catch {
      toast('Error al procesar la solicitud', 'error')
    } finally {
      setProcessing(null)
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-sm" style={{ color: 'var(--c-ghost)' }}>
        Cargando solicitudes...
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--c-ghost)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Dashboard Admin
        </Link>
      </div>
      <div className="mb-7">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)' }}>Admin</p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)' }}>Aprobación de Descuentos</h1>
      </div>

      {approvals.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--c-dim)' }}>
            No hay descuentos pendientes
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--c-ghost)' }}>
            Todos los descuentos han sido revisados.
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Cotización</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Vendedor</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Línea</th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-24" style={{ color: 'var(--c-ghost)' }}>Tipo</th>
                  <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-24" style={{ color: 'var(--c-ghost)' }}>Descuento</th>
                  <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-24" style={{ color: 'var(--c-ghost)' }}>Solicitado</th>
                  <th className="px-4 py-3.5 w-40"></th>
                </tr>
              </thead>
              <tbody>
                {approvals.map(a => {
                  const busy = processing === a.id
                  return (
                    <tr key={a.id} style={{ borderTop: '1px solid var(--c-rim)' }}>
                      <td className="px-4 py-3">
                        <a
                          href={`/quotes/${a.quote_id}`}
                          className="font-mono text-xs font-semibold hover:opacity-75 transition-opacity"
                          style={{ color: 'var(--c-navy)' }}
                        >
                          {a.quote_number}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--c-dim)' }}>
                        {a.requester_username}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate" style={{ color: 'var(--c-ink)' }}>
                        {a.quote_line_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={a.quote_line_display_type === 'product'
                            ? { background: 'rgba(99,102,241,0.1)', color: 'rgb(99,102,241)', border: '1px solid rgba(99,102,241,0.3)' }
                            : { background: 'var(--c-amber-bg, rgba(251,191,36,0.12))', color: 'var(--c-amber)', border: '1px solid rgba(251,191,36,0.3)' }
                          }>
                          {a.quote_line_display_type === 'product' ? 'Individual' : 'Global'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold" style={{ color: 'var(--c-amber)' }}>
                        {Number(a.discount_percent).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--c-ghost)' }}>
                        {new Date(a.created_at).toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-4 py-3">
                        <div className={`flex gap-2 justify-end ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
                          <button
                            onClick={() => decide(a.id, 'approved')}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                            style={{ background: 'var(--c-navy)', color: '#fff' }}
                          >
                            Aprobar
                          </button>
                          <button
                            onClick={() => decide(a.id, 'rejected')}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                            style={{ background: 'var(--c-rose)', color: '#fff' }}
                          >
                            Rechazar
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
      )}
    </div>
  )
}
