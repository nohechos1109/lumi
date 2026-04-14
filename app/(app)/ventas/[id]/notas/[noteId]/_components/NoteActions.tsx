'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

interface Props {
  noteId: string
  noteState: 'draft' | 'confirmed' | 'cancelled' | 'paid'
  amountPaid: string
  saleId: string
  role: string
}

export default function NoteActions({ noteId, noteState, amountPaid, saleId, role }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const isDraft = noteState === 'draft'
  const canConfirm = isDraft && (role === 'sales' || role === 'manager' || role === 'admin')
  const canCancel = (isDraft || noteState === 'confirmed') && (role === 'manager' || role === 'admin')

  async function handleStateChange(newState: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/sales/${saleId}/notes/${noteId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast(d.error ?? 'Error al cambiar estado', 'error')
        return
      }
      toast(newState === 'confirmed' ? 'Nota confirmada' : 'Nota cancelada')
      router.push(`/ventas/${saleId}`)
    } catch {
      toast('Error al cambiar estado', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {canConfirm && (
        <button
          onClick={() => handleStateChange('confirmed')}
          disabled={busy}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: '#059669', color: '#fff' }}
        >
          {busy ? 'Procesando...' : 'Confirmar nota'}
        </button>
      )}
      {canCancel && (
        <button
          onClick={() => handleStateChange('cancelled')}
          disabled={busy}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: 'transparent', color: '#BE123C', border: '1px solid #BE123C' }}
        >
          Cancelar nota
        </button>
      )}
      {(noteState === 'confirmed' || noteState === 'paid') && (
        <a
          href={`/api/pdf/sale-note/${noteId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          Nota PDF
        </a>
      )}
      {(noteState === 'confirmed' || noteState === 'paid') && Number(amountPaid) > 0 && (
        <a
          href={`/api/pdf/sale-note/${noteId}/payments`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Pagos PDF
        </a>
      )}
    </div>
  )
}
