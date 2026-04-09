'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast, notifyRefresh } from '@/lib/toast'

interface Props {
  projectId: string
  currentStatus: string
}

const PROJECT_STATUSES = [
  { value: 'follow_up', label: 'Seguimiento' },
  { value: 'demo',      label: 'Demo' },
  { value: 'approved',  label: 'Aprobado' },
  { value: 'process',   label: 'En Proceso' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'finished',  label: 'Terminado' },
]

export default function ProjectStatusEditor({ projectId, currentStatus }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleChange(newStatus: string) {
    if (newStatus === currentStatus) return
    setLoading(true)
    try {
      const r = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!r.ok) throw new Error()
      notifyRefresh()
      toast('Estado del proyecto actualizado')
      router.refresh()
    } catch {
      toast('Error al actualizar el estado', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--c-ghost)' }}>
        Estado:
      </span>
      <select
        value={currentStatus}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value)}
        className="text-xs font-bold py-1 px-3 rounded-full border-none focus:ring-0 cursor-pointer transition-all"
        style={{
          background: 'var(--c-navy-bg)',
          color: 'var(--c-navy)',
          appearance: 'none',
          textAlign: 'center'
        }}
      >
        {PROJECT_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label.toUpperCase()}
          </option>
        ))}
      </select>
      {loading && <span className="animate-spin text-xs">⏳</span>}
    </div>
  )
}
