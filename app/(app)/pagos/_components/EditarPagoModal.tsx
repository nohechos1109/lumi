'use client'

import { useState } from 'react'
import type { CustomerPayment } from '@/lib/queries/customer-payments'

import { PAYMENT_METHODS } from '@/lib/constants/payments'

interface Props {
  payment: CustomerPayment
  onClose: () => void
  onUpdated: () => void
}

export default function EditarPagoModal({ payment, onClose, onUpdated }: Props) {
  const [amount, setAmount] = useState(String(Number(payment.amount)))
  const [method, setMethod] = useState(payment.payment_method)
  const [date, setDate] = useState(payment.payment_date.slice(0, 10))
  const [concept, setConcept] = useState(payment.concept ?? '')
  const [reference, setReference] = useState(payment.reference ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const n = Number(amount)
    if (!n || n <= 0) { setError('Ingresa un monto válido'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/pagos/${payment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: n,
          payment_method: method,
          payment_date: date,
          concept: concept || null,
          reference: reference || null,
        }),
      })
      if (res.ok) {
        onUpdated()
      } else {
        const d = await res.json()
        setError(d.error ?? 'Error al actualizar pago')
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
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(27,52,97,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Editar Pago</h2>
            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--c-ghost)' }}>{payment.number}</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Customer (read-only) */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>CLIENTE</label>
            <div className="rounded-lg px-3 py-2 text-sm font-medium"
              style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8' }}>
              {payment.customer_name}
            </div>
          </div>

          {/* Amount + Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>
                MONTO <span style={{ color: '#BE123C' }}>*</span>
              </label>
              <input
                type="number" step="0.01" min="0.01"
                value={amount} onChange={e => setAmount(e.target.value)}
                required autoFocus
                className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>
                METODO <span style={{ color: '#BE123C' }}>*</span>
              </label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}>
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          {/* Date + Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>FECHA</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                required className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>REFERENCIA</label>
              <input type="text" value={reference} onChange={e => setReference(e.target.value)}
                placeholder="Numero de transf..."
                className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
            </div>
          </div>

          {/* Concept */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>CONCEPTO</label>
            <input type="text" value={concept} onChange={e => setConcept(e.target.value)}
              placeholder="Opcional..."
              className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle} />
          </div>

          {error && <p className="text-xs" style={{ color: '#BE123C' }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ background: 'var(--c-rim)', color: 'var(--c-ink)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: 'var(--c-navy)', color: '#fff' }}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  background: 'var(--c-rim)',
  border: '1px solid var(--c-rim)',
  color: 'var(--c-ink)',
  outline: 'none',
}
