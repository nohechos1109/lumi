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
        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: '#15803D', cursor: busy ? 'not-allowed' : 'pointer', border: 'none', opacity: busy ? 0.6 : 1 }}
      >
        Aprobar y crear proyecto
      </button>
      <button
        onClick={() => act('reject')}
        disabled={busy}
        className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
        style={{ background: '#991B1B', cursor: busy ? 'not-allowed' : 'pointer', border: 'none', opacity: busy ? 0.6 : 1 }}
      >
        Rechazar
      </button>
    </div>
  )
}
