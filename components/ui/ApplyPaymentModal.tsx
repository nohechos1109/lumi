'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'

interface SaleNote {
  id: string
  number: string
  amount_total: string
  amount_balance: string
}

interface Props {
  saleId: string
  paymentId: string
  notes: SaleNote[]
  onClose: () => void
  onApplied: () => void
}

export default function ApplyPaymentModal({ saleId, paymentId, notes, onClose, onApplied }: Props) {
  const [selectedNoteId, setSelectedNoteId] = useState(notes[0]?.id ?? '')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const selectedNote = notes.find(n => n.id === selectedNoteId)
  const maxAmount = selectedNote ? Number(selectedNote.amount_balance) : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedNoteId || !amount || Number(amount) <= 0) {
      toast('Selecciona una nota y un monto válido', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/sales/${saleId}/payments/${paymentId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sale_note_id: selectedNoteId, amount: Number(amount) }),
      })

      if (!res.ok) {
        const d = await res.json()
        toast(d.error ?? 'Error al aplicar pago', 'error')
        return
      }

      onApplied()
    } catch {
      toast('Error al aplicar pago', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fmt = (v: string) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })
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
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-4"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--c-ink)' }}>Aplicar Pago a Nota</h2>

        {notes.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--c-ghost)' }}>
            No hay notas con saldo disponible para aplicar.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Nota</label>
              <select
                value={selectedNoteId}
                onChange={e => { setSelectedNoteId(e.target.value); setAmount('') }}
                className="text-sm rounded-lg px-3 py-2"
                style={inputStyle}
              >
                {notes.map(n => (
                  <option key={n.id} value={n.id}>
                    {n.number} — Saldo: ${fmt(n.amount_balance)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
                Monto a aplicar (máx: ${maxAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={maxAmount}
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="text-sm rounded-lg px-3 py-2"
                style={inputStyle}
                placeholder="0.00"
              />
            </div>
          </>
        )}

        <div className="flex gap-3 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
            style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
          >
            Cancelar
          </button>
          {notes.length > 0 && (
            <button
              type="submit"
              disabled={loading || !amount || !selectedNoteId}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: 'var(--c-navy)', color: '#fff' }}
            >
              {loading ? 'Aplicando...' : 'Aplicar'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
