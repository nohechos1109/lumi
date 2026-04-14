'use client'

import { useState } from 'react'

interface Props {
  saleId: string
  noteId: string
  remision: string
  initialObservaciones: string | null
  onClose: () => void
  onSaved: () => void
}

export default function EditFieldsModal({
  saleId, noteId, remision,
  initialObservaciones,
  onClose, onSaved,
}: Props) {
  const [observaciones, setObservaciones] = useState(initialObservaciones ?? '')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/sales/${saleId}/notes/${noteId}/fields`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observaciones }),
      })
      if (res.ok) {
        onSaved()
        onClose()
      } else {
        const d = await res.json()
        setError(d.error ?? 'Error al guardar')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 8px 32px rgba(27,52,97,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Editar Datos</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>{remision}</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>OBSERVACIONES</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Notas internas..."
              rows={3}
              className="w-full rounded-lg px-3 py-2 text-sm resize-none"
              style={{ background: 'var(--c-rim)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }}
            />
          </div>

          {error && <p className="text-xs" style={{ color: '#BE123C' }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ background: 'var(--c-rim)', color: 'var(--c-ink)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: 'var(--c-navy)', color: '#fff' }}
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
