'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ServiceRequest } from '@/lib/queries/servicios'
import { notifyRefresh, toast } from '@/lib/toast'

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pending:    { label: 'Pendiente',  bg: '#FEF3C7', text: '#B45309' },
  approved:   { label: 'Aprobada',   bg: '#DCFCE7', text: '#15803D' },
  rejected:   { label: 'Rechazada',  bg: '#FEE2E2', text: '#991B1B' },
  cancelled:  { label: 'Cancelada',  bg: '#F1F5F9', text: '#475569' },
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
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--c-rim)' }}>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
            <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Motivo</th>
            <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Cliente</th>
            <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Solicitante</th>
            <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Asignado</th>
            <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
            <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Creada</th>
            <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(r => {
            const s = STATUS_MAP[r.status] ?? STATUS_MAP.pending
            return (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                <td className="px-4 py-2.5" style={{ color: 'var(--c-ink)' }}>{r.motivo}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }}>{r.customer_name ?? '—'}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }}>{r.requested_by_username ?? '—'}</td>
                <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }}>{r.assigned_to_username ?? 'Sin asignar'}</td>
                <td className="px-4 py-2.5">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
                    {s.label}
                  </span>
                </td>
                <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }} suppressHydrationWarning>
                  {new Date(r.created_at).toLocaleDateString('es-MX')}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {canApprove && r.status === 'pending' ? (
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => handleAction(r.id, 'approve')}
                        disabled={busy === r.id}
                        className="px-3 py-1 rounded text-xs font-semibold text-white"
                        style={{ background: '#15803D', cursor: busy === r.id ? 'not-allowed' : 'pointer', border: 'none', opacity: busy === r.id ? 0.6 : 1 }}
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => handleAction(r.id, 'reject')}
                        disabled={busy === r.id}
                        className="px-3 py-1 rounded text-xs font-semibold text-white"
                        style={{ background: '#991B1B', cursor: busy === r.id ? 'not-allowed' : 'pointer', border: 'none', opacity: busy === r.id ? 0.6 : 1 }}
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
  )
}
