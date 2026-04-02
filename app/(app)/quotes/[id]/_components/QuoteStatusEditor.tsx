'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { QuoteState } from '@/lib/queries/quotes'

interface Props {
  quoteId: string
  currentStatus: QuoteState
  role: string
}

const QUOTE_STATUSES: { value: QuoteState; label: string }[] = [
  { value: 'draft',     label: 'Borrador' },
  { value: 'sent',      label: 'Enviada' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'expired',   label: 'Expirada' },
  { value: 'cancelled', label: 'Cancelada' },
]

export default function QuoteStatusEditor({ quoteId, currentStatus, role }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Determine allowed statuses based on role (mirroring API logic)
  const allowedTransitions: Record<string, QuoteState[]> = {
    sales:   ['sent', 'cancelled'],
    manager: ['confirmed', 'cancelled'],
    admin:   ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
  }

  const allowed = allowedTransitions[role] || []
  const isAllowed = (status: QuoteState) => status === currentStatus || allowed.includes(status)

  async function handleChange(newState: QuoteState) {
    if (newState === currentStatus) return
    setLoading(true)
    try {
      const r = await fetch(`/api/quotes/${quoteId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      })
      if (!r.ok) throw new Error()
      toast('Estado de la cotización actualizado')
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
        Estatus:
      </span>
      <select
        value={currentStatus}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value as QuoteState)}
        className="text-xs font-bold py-1 px-3 rounded-full border-none focus:ring-0 cursor-pointer transition-all"
        style={{
          background: 'var(--c-navy-bg)',
          color: 'var(--c-navy)',
          appearance: 'none',
          textAlign: 'center'
        }}
      >
        {QUOTE_STATUSES.filter(s => isAllowed(s.value)).map((s) => (
          <option 
            key={s.value} 
            value={s.value}
          >
            {s.label.toUpperCase()}
          </option>
        ))}
      </select>
      {loading && <span className="animate-spin text-xs">⏳</span>}
    </div>
  )
}
