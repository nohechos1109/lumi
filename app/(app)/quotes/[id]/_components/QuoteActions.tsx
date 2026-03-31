'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from '@/lib/toast'

interface Props {
  quoteId: string
  currentState: string
  role: string
}

const CONFIRM_MESSAGES: Partial<Record<string, string>> = {
  cancelled: '¿Cancelar esta cotización? No podrá volver a borrador.',
  confirmed: '¿Confirmar esta cotización? El cliente será notificado.',
}

export default function QuoteActions({ quoteId, currentState, role }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [pendingState, setPendingState] = useState<string | null>(null)

  async function changeState(state: string) {
    setLoading(true)
    setPendingState(null)
    try {
      const r = await fetch(`/api/quotes/${quoteId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state }),
      })
      if (!r.ok) throw new Error()
      toast('Estado actualizado')
      router.refresh()
    } catch {
      toast('Error al cambiar el estado', 'error')
    } finally {
      setLoading(false)
    }
  }

  function requestState(state: string) {
    if (CONFIRM_MESSAGES[state]) {
      setPendingState(state)
    } else {
      changeState(state)
    }
  }

  const btnBase = `text-sm px-4 py-2 rounded-xl font-semibold transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'hover:opacity-80'}`

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {currentState === 'draft' && role === 'sales' && (
          <button
            onClick={() => requestState('sent')}
            disabled={loading}
            className={btnBase}
            style={{ background: 'var(--c-sky-bg)', color: 'var(--c-sky)', border: '1px solid var(--c-sky-bd)' }}
          >
            Enviar
          </button>
        )}
        {currentState === 'sent' && role === 'manager' && (
          <button
            onClick={() => requestState('confirmed')}
            disabled={loading}
            className={btnBase}
            style={{ background: 'var(--c-mint-bg)', color: 'var(--c-mint)', border: '1px solid rgba(30,201,122,0.28)' }}
          >
            Confirmar
          </button>
        )}
        {['draft', 'sent'].includes(currentState) && (
          <button
            onClick={() => requestState('cancelled')}
            disabled={loading}
            className={btnBase}
            style={{ background: 'var(--c-rose-bg)', color: 'var(--c-rose)', border: '1px solid rgba(240,64,85,0.2)' }}
          >
            Cancelar
          </button>
        )}
        <Link
          href={`/api/pdf/${quoteId}`}
          target="_blank"
          className={btnBase}
          style={{ background: 'var(--c-panel)', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
        >
          Exportar PDF
        </Link>
      </div>

      {pendingState && (
        <ConfirmModal
          message={CONFIRM_MESSAGES[pendingState]!}
          confirmLabel={pendingState === 'cancelled' ? 'Cancelar cotización' : 'Confirmar'}
          danger={pendingState === 'cancelled'}
          onConfirm={() => changeState(pendingState)}
          onCancel={() => setPendingState(null)}
        />
      )}
    </>
  )
}
