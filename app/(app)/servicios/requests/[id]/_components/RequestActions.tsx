'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { notifyRefresh, toast } from '@/lib/toast'

export default function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function act(action: 'approve' | 'reject') {
    setBusy(true)
    try {
      const res = await fetch(`/api/servicios/requests/${requestId}/${action}`, { method: 'POST' })
      const result = await res.json()
      if (!res.ok) {
        toast(result.error || `Error al ${action === 'approve' ? 'aprobar' : 'rechazar'}`, 'error')
        return
      }
      toast(action === 'approve' ? 'Solicitud aprobada' : 'Solicitud rechazada', 'success')
      notifyRefresh()
      if (action === 'approve' && result.project) {
        router.push(`/servicios/projects/${result.project.id}`)
      } else {
        router.refresh()
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => act('approve')}
        disabled={busy}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{
          background: busy ? 'var(--c-rim-hi)' : 'var(--c-mint)',
          cursor: busy ? 'not-allowed' : 'pointer',
          border: 'none',
          opacity: busy ? 0.6 : 1,
          boxShadow: busy ? 'none' : '0 2px 8px rgba(5,150,105,0.20)',
        }}
      >
        Aprobar y crear proyecto
      </button>
      <button
        onClick={() => act('reject')}
        disabled={busy}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
        style={{
          background: 'var(--c-rose-bg)',
          color: 'var(--c-rose)',
          border: '1px solid rgba(220,38,38,0.20)',
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy ? 0.6 : 1,
        }}
      >
        Rechazar
      </button>
    </div>
  )
}
