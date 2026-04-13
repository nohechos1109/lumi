'use client'

import { useState } from 'react'

import { PAYMENT_METHODS } from '@/lib/constants/payments'

interface Props {
  noteId: string
  remision: string
  balance: string
  onClose: () => void
  onCreated: () => void
}

export default function AbonoModal({ noteId, remision, balance, onClose, onCreated }: Props) {
  const [amount, setAmount]   = useState(parseFloat(balance).toFixed(2))
  const [method, setMethod]   = useState('transferencia')
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10))
  const [concept, setConcept] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const n = parseFloat(amount)
    if (!n || n <= 0) { setError('Ingresa un monto válido'); return }
    const maxBalance = parseFloat(balance)
    if (n > maxBalance + 0.005) {
      setError(`El monto no puede exceder el saldo ($${maxBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })})`)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/cobranza/${noteId}/abono`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: n, payment_method: method, payment_date: date, concept: concept || null }),
      })
      if (res.ok) {
        onCreated()
        onClose()
      } else {
        const d = await res.json()
        setError(d.error ?? 'Error al registrar abono')
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
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 8px 32px rgba(27,52,97,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Registrar Abono</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>{remision}</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        {/* Saldo info */}
        <div className="rounded-lg px-4 py-2.5 mb-5 text-sm flex justify-between items-center"
          style={{ background: 'var(--c-rim)' }}>
          <span style={{ color: 'var(--c-ghost)' }}>Saldo pendiente</span>
          <span className="font-bold font-mono" style={{ color: '#B45309' }}>
            ${parseFloat(balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>MONTO</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="w-full rounded-lg px-3 py-2 text-sm font-mono"
              style={{ background: 'var(--c-rim)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>MÉTODO</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--c-rim)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }}
            >
              {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>FECHA</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: 'var(--c-rim)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }}
            />
          </div>

          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>CONCEPTO (opcional)</label>
            <input
              type="text"
              value={concept}
              onChange={e => setConcept(e.target.value)}
              placeholder="Anticipo, 1er pago..."
              className="w-full rounded-lg px-3 py-2 text-sm"
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
              {loading ? 'Guardando…' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
