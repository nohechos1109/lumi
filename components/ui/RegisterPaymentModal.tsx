'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'

interface Props {
  saleId: string
  onClose: () => void
  onCreated: () => void
}

export default function RegisterPaymentModal({ saleId, onClose, onCreated }: Props) {
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('transferencia')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) {
      toast('El importe debe ser mayor a 0', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/sales/${saleId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: concept || null,
          amount: Number(amount),
          payment_method: method,
          payment_date: date,
          reference: reference || null,
          notes: notes || null,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        toast(d.error ?? 'Error al registrar pago', 'error')
        return
      }

      onCreated()
    } catch {
      toast('Error al registrar pago', 'error')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    background: 'var(--c-panel)',
    border: '1px solid var(--c-rim)',
    color: 'var(--c-ink)',
    outline: 'none',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--c-ink)' }}>Registrar Pago</h2>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Importe *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
            className="text-sm rounded-lg px-3 py-2"
            style={inputStyle}
            placeholder="0.00"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Método de pago</label>
          <select value={method} onChange={e => setMethod(e.target.value)} className="text-sm rounded-lg px-3 py-2" style={inputStyle}>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
            <option value="cheque">Cheque</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Fecha</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="text-sm rounded-lg px-3 py-2" style={inputStyle} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Referencia</label>
            <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="text-sm rounded-lg px-3 py-2" style={inputStyle} placeholder="# transferencia" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Concepto</label>
          <input type="text" value={concept} onChange={e => setConcept(e.target.value)} className="text-sm rounded-lg px-3 py-2" style={inputStyle} placeholder="Ej: Anticipo, Pago 2..." />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Notas</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="text-sm rounded-lg px-3 py-2 resize-none" style={inputStyle} />
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
            style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !amount}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: '#059669', color: '#fff' }}
          >
            {loading ? 'Registrando...' : 'Registrar Pago'}
          </button>
        </div>
      </form>
    </div>
  )
}
