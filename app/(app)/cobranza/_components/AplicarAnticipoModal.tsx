'use client'

import { useState } from 'react'
import { fmtMXN } from '@/lib/formatters'

interface Props {
  saleId: string
  noteId: string
  remision: string
  noteBalance: string        // saldo pendiente de la nota
  anticipoDisponible: string // crédito disponible en la venta
  onClose: () => void
  onApplied: () => void
}

export default function AplicarAnticipoModal({
  saleId, noteId, remision, noteBalance, anticipoDisponible, onClose, onApplied,
}: Props) {
  const balance   = parseFloat(noteBalance)
  const available = parseFloat(anticipoDisponible)
  const maxApply  = Math.min(balance, available)

  const [amount,  setAmount]  = useState(maxApply.toFixed(2))
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const n = parseFloat(amount)
    if (!n || n <= 0) { setError('Ingresa un monto válido'); return }
    if (n > available + 0.005) {
      setError(`Excede el crédito disponible ($${fmtMXN(available)})`); return
    }
    if (n > balance + 0.005) {
      setError(`Excede el saldo de la nota ($${fmtMXN(balance)})`); return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/cobranza/anticipo/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale_id: saleId, note_id: noteId, amount: n }),
      })
      if (res.ok) {
        onApplied()
        onClose()
      } else {
        const d = await res.json()
        setError(d.error ?? 'Error al aplicar anticipo')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(27,52,97,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Aplicar Anticipo</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>{remision}</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        {/* Info pills */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <div className="rounded-lg px-3 py-2 text-center" style={{ background: 'var(--c-rim)' }}>
            <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>Saldo nota</p>
            <p className="text-sm font-mono font-bold" style={{ color: '#B45309' }}>${fmtMXN(balance)}</p>
          </div>
          <div className="rounded-lg px-3 py-2 text-center" style={{ background: '#F0FDF4' }}>
            <p className="text-xs" style={{ color: '#166534' }}>Crédito disponible</p>
            <p className="text-sm font-mono font-bold" style={{ color: '#15803D' }}>${fmtMXN(available)}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>
              MONTO A APLICAR <span style={{ color: 'var(--c-ghost)', fontWeight: 400 }}>(máx ${fmtMXN(maxApply)})</span>
            </label>
            <input
              autoFocus
              type="number"
              step="0.01"
              min="0.01"
              max={maxApply}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="w-full rounded-lg px-3 py-2 text-sm font-mono"
              style={{
                background: 'var(--c-rim)',
                border: '1px solid var(--c-rim)',
                color: 'var(--c-ink)',
                outline: 'none',
              }}
            />
          </div>

          <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
            El crédito se tomará de los anticipos más antiguos de la venta.
            No se genera un nuevo pago en efectivo.
          </p>

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
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: '#059669', color: '#fff' }}
            >
              {loading ? 'Aplicando…' : 'Aplicar crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
