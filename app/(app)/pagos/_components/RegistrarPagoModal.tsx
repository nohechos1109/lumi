'use client'

import { useState } from 'react'
import type { Customer } from '@/lib/queries/customers'
import CustomerSearchSelect from '@/components/ui/CustomerSearchSelect'

const METHODS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'tarjeta',       label: 'Tarjeta' },
  { value: 'otro',          label: 'Otro' },
]

interface Props {
  customers: Customer[]
  onClose: () => void
  onCreated: () => void
}

export default function RegistrarPagoModal({ customers, onClose, onCreated }: Props) {
  const today = new Date().toISOString().slice(0, 10)

  const [customerId, setCustomerId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('transferencia')
  const [date, setDate] = useState(today)
  const [concept, setConcept] = useState('')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!customerId) { setError('Selecciona un cliente'); return }
    const n = Number(amount)
    if (!n || n <= 0) { setError('Ingresa un monto válido'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          concept: concept || null,
          amount: n,
          payment_method: method,
          payment_date: date,
          reference: reference || null,
        }),
      })
      if (res.ok) {
        onCreated()
        onClose()
      } else {
        const d = await res.json()
        setError(d.error ?? 'Error al registrar pago')
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
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(27,52,97,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Registrar Pago</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>Se crea confirmado directamente</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Customer search */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>
              CLIENTE <span style={{ color: '#BE123C' }}>*</span>
            </label>
            <CustomerSearchSelect
              customers={customers}
              value={customerId}
              onChange={setCustomerId}
            />
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
                required
                className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>
                MÉTODO <span style={{ color: '#BE123C' }}>*</span>
              </label>
              <select value={method} onChange={e => setMethod(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm" style={inputStyle}>
                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
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
                placeholder="Número de transf..."
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
              {loading ? 'Guardando…' : 'Registrar pago'}
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
