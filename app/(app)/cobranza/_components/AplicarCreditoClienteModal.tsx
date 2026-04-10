'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { PendingNote } from '@/app/api/customers/[id]/pending-notes/route'

const fmtMXN = (n: number) =>
  n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Props {
  customerId: string
  customerName: string
  creditDisponible: string   // total credit available for this customer
  onClose: () => void
  onApplied: () => void
}

export default function AplicarCreditoClienteModal({
  customerId, customerName, creditDisponible, onClose, onApplied,
}: Props) {
  const available = parseFloat(creditDisponible)

  const [notes, setNotes]       = useState<PendingNote[]>([])
  const [loading, setLoading]   = useState(true)
  const [amounts, setAmounts]   = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/customers/${customerId}/pending-notes`)
      .then(r => r.ok ? r.json() : [])
      .then((rows: PendingNote[]) => {
        setNotes(rows)
        const init: Record<string, string> = {}
        rows.forEach(n => { init[n.id] = '' })
        setAmounts(init)
      })
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [customerId])

  const parsedAmounts = useMemo(() =>
    Object.fromEntries(
      Object.entries(amounts).map(([id, v]) => [id, parseFloat(v) || 0])
    ), [amounts])

  const totalAssigned = useMemo(
    () => Object.values(parsedAmounts).reduce((s, v) => s + v, 0),
    [parsedAmounts]
  )

  const remaining = Math.round((available - totalAssigned) * 100) / 100
  const overBudget = totalAssigned > available + 0.005

  const setAmount = useCallback((noteId: string, val: string) => {
    setAmounts(prev => ({ ...prev, [noteId]: val }))
  }, [])

  const fillNote = useCallback((note: PendingNote) => {
    const bal = Number(note.amount_balance)
    const rem = Math.max(0, Math.round((available - (totalAssigned - (parsedAmounts[note.id] || 0))) * 100) / 100)
    setAmounts(prev => ({ ...prev, [note.id]: Math.min(bal, rem).toFixed(2) }))
  }, [available, totalAssigned, parsedAmounts])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const toApply = notes.filter(n => (parsedAmounts[n.id] || 0) > 0.005)
    if (toApply.length === 0) { setError('Asigna monto a al menos una nota'); return }
    if (overBudget) { setError(`El total supera el crédito disponible ($${fmtMXN(available)})`); return }

    setSubmitting(true)
    try {
      // Apply FIFO credit to each selected note sequentially
      for (const note of toApply) {
        const amt = parsedAmounts[note.id]
        if (amt <= 0.005) continue
        const res = await fetch('/api/cobranza/credit/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note_id: note.id, amount: amt }),
        })
        if (!res.ok) {
          const d = await res.json()
          setError(`${note.number}: ${d.error ?? 'Error al aplicar'}`)
          return
        }
      }
      onApplied()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6 flex flex-col"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(27,52,97,0.18)',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>
              Descontar crédito a notas
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>{customerName}</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        {/* Budget bar */}
        <div className="rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between"
          style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
          <span className="text-xs font-semibold" style={{ color: '#166534' }}>
            💰 Crédito disponible del cliente
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold" style={{ color: '#15803D' }}>
              ${fmtMXN(available)}
            </span>
            {totalAssigned > 0.005 && (
              <>
                <span className="text-xs" style={{ color: 'var(--c-ghost)' }}>→</span>
                <span className="text-sm font-mono font-bold"
                  style={{ color: overBudget ? '#BE123C' : remaining > 0.005 ? '#D97706' : '#15803D' }}>
                  Restante: ${fmtMXN(remaining)}
                </span>
              </>
            )}
          </div>
        </div>

        <p className="text-xs mb-4 rounded-lg px-3 py-2" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
          El crédito se tomará de los pagos más antiguos del cliente (FIFO).
          Asigna cuánto descontar en cada nota.
        </p>

        {/* Notes table */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto min-h-0">
          {loading ? (
            <p className="text-xs py-8 text-center" style={{ color: 'var(--c-ghost)' }}>Cargando notas…</p>
          ) : notes.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: 'var(--c-ghost)' }}>
              No hay notas pendientes para este cliente
            </p>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-rim)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--c-rim)' }}>
                    <th className="px-3 py-1.5 text-left font-semibold" style={{ color: 'var(--c-ghost)' }}>REMISIÓN</th>
                    <th className="px-3 py-1.5 text-left font-semibold" style={{ color: 'var(--c-ghost)' }}>O.S.</th>
                    <th className="px-3 py-1.5 text-right font-semibold" style={{ color: 'var(--c-ghost)' }}>SALDO</th>
                    <th className="px-3 py-1.5 text-right font-semibold" style={{ color: 'var(--c-ghost)' }}>DESCONTAR</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map(n => {
                    const bal = Number(n.amount_balance)
                    const amt = parsedAmounts[n.id] || 0
                    const tooMuch = amt > bal + 0.005
                    return (
                      <tr key={n.id} style={{ borderTop: '1px solid var(--c-rim)' }}>
                        <td className="px-3 py-2 font-mono font-medium" style={{ color: 'var(--c-ink)' }}>
                          {n.number}
                        </td>
                        <td className="px-3 py-2 font-mono" style={{ color: 'var(--c-dim)' }}>
                          {n.sale_number}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold" style={{ color: '#B45309' }}>
                          ${fmtMXN(bal)}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => fillNote(n)}
                              className="text-xs px-1.5 py-0.5 rounded font-semibold hover:opacity-75 transition-opacity"
                              style={{ background: '#EFF6FF', color: '#1D4ED8' }}
                              title="Rellenar con máximo aplicable"
                            >
                              Max
                            </button>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max={bal}
                              value={amounts[n.id] ?? ''}
                              placeholder="0.00"
                              onChange={e => setAmount(n.id, e.target.value)}
                              className="w-24 rounded px-2 py-1 text-xs font-mono text-right"
                              style={{
                                background: 'var(--c-rim)',
                                border: `1px solid ${tooMuch ? '#BE123C' : 'var(--c-rim)'}`,
                                color: tooMuch ? '#BE123C' : 'var(--c-ink)',
                                outline: 'none',
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {totalAssigned > 0.005 && (
                  <tfoot>
                    <tr style={{ background: 'var(--c-rim)', borderTop: '2px solid var(--c-ghost)' }}>
                      <td colSpan={3} className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--c-ghost)' }}>
                        TOTAL A DESCONTAR
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-xs"
                        style={{ color: overBudget ? '#BE123C' : '#15803D' }}>
                        ${fmtMXN(totalAssigned)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {error && <p className="text-xs" style={{ color: '#BE123C' }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ background: 'var(--c-rim)', color: 'var(--c-ink)' }}>
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || notes.length === 0 || overBudget || totalAssigned <= 0.005}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: '#059669', color: '#fff' }}>
              {submitting ? 'Aplicando…' : 'Descontar crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
