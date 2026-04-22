'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ServiceRequest } from '@/lib/queries/servicios'
import { notifyRefresh, toast } from '@/lib/toast'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pendiente', cls: 'badge badge-in-progress' },
  approved:  { label: 'Aprobada',  cls: 'badge badge-approved' },
  rejected:  { label: 'Rechazada', cls: 'badge badge-rejected' },
  cancelled: { label: 'Cancelada', cls: 'badge badge-cancelled' },
}

export default function ServiceRequestsTable({ requests, canApprove }: { requests: ServiceRequest[]; canApprove: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)

  async function handleAction(id: string, action: 'approve' | 'reject') {
    setBusy(id)
    try {
      const res = await fetch(`/api/servicios/requests/${id}/${action}`, { method: 'POST' })
      const result = await res.json()
      if (!res.ok) {
        toast(result.error || `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'} la solicitud`, 'error')
        return
      }
      toast(action === 'approve' ? 'Solicitud aprobada' : 'Solicitud rechazada', 'success')
      notifyRefresh()
      router.refresh()
      if (action === 'approve' && result.project) {
        router.push(`/servicios/projects/${result.project.id}`)
      }
    } finally {
      setBusy(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--c-rim)', color: 'var(--c-dim)' }}>
        Sin solicitudes.
      </div>
    )
  }

  return (
    <div
      className="rounded-xl overflow-hidden shadow-sm"
      style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Motivo</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Cliente</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Solicitante</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Asignado</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Estado</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Creada</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--c-rim)]">
            {requests.map(r => {
              const s = STATUS_MAP[r.status] ?? STATUS_MAP.pending
              return (
                <tr
                  key={r.id}
                  tabIndex={0}
                  role="link"
                  className="tr-hover transition-colors"
                  style={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/servicios/requests/${r.id}`)}
                  onKeyDown={e => { if (e.key === 'Enter') router.push(`/servicios/requests/${r.id}`) }}
                >
                  <td className="px-5 py-4" style={{ color: 'var(--c-ink)' }}>{r.motivo}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }}>{r.customer_name ?? '—'}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }}>{r.requested_by_username ?? '—'}</td>
                  <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }}>{r.assigned_to_username ?? 'Sin asignar'}</td>
                  <td className="px-5 py-4">
                    <span className={s.cls}>{s.label}</span>
                  </td>
                  <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }} suppressHydrationWarning>
                    {new Date(r.created_at).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {canApprove && r.status === 'pending' ? (
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={e => { e.stopPropagation(); handleAction(r.id, 'approve') }}
                          disabled={busy === r.id}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                          style={{ background: 'var(--c-mint-bg)', color: 'var(--c-mint)', border: '1px solid rgba(11,153,98,0.25)', cursor: busy === r.id ? 'not-allowed' : 'pointer', opacity: busy === r.id ? 0.6 : 1 }}
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); handleAction(r.id, 'reject') }}
                          disabled={busy === r.id}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-80"
                          style={{ background: 'var(--c-rose-bg)', color: 'var(--c-rose)', border: '1px solid rgba(220,38,38,0.20)', cursor: busy === r.id ? 'not-allowed' : 'pointer', opacity: busy === r.id ? 0.6 : 1 }}
                        >
                          Rechazar
                        </button>
                      </div>
                    ) : r.resolved_project_number ? (
                      <span className="text-xs font-mono" style={{ color: 'var(--c-dim)' }}>{r.resolved_project_number}</span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--c-ghost)' }}>—</span>
                    )}
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
