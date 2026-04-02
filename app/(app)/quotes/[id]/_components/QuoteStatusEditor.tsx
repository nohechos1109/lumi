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

  if (currentStatus !== 'draft') {
    const s = QUOTE_STATUSES.find(x => x.value === currentStatus) || { label: currentStatus, value: currentStatus }
    const badgeColors: Record<string, { bg: string; text: string }> = {
      sent:      { bg: 'var(--c-sky-bg)',  text: 'var(--c-sky)' },
      confirmed: { bg: 'var(--c-mint-bg)', text: 'var(--c-mint)' },
      cancelled: { bg: 'var(--c-rose-bg)', text: 'var(--c-rose)' },
      expired:   { bg: 'var(--c-base)',     text: 'var(--c-ghost)' },
    }
    const colors = badgeColors[currentStatus] || { bg: 'var(--c-base)', text: 'var(--c-dim)' }

    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--c-ghost)' }}>
          Estatus:
        </span>
        <span 
          className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
          style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.text}40` }}
        >
          {s.label}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <button
        disabled={loading}
        onClick={() => handleChange('sent')}
        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:opacity-85 shadow-sm active:scale-95 disabled:opacity-50"
        style={{ background: 'var(--c-navy)', color: '#FFFFFF' }}
      >
        {loading ? '...' : 'Enviar'}
      </button>
      <button
        disabled={loading}
        onClick={() => {
          if (confirm('¿Seguro que deseas cancelar esta cotización?')) handleChange('cancelled')
        }}
        className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:bg-red-50 active:scale-95 disabled:opacity-50"
        style={{ color: 'var(--c-rose)', border: '1px solid var(--c-rose-bg)', background: 'transparent' }}
      >
        Cancelar
      </button>
      {loading && <span className="animate-spin text-xs">⏳</span>}
    </div>
  )
}
