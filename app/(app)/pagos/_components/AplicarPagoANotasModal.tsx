'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { CustomerPayment } from '@/lib/queries/customer-payments'
import type { ApplicableNote } from '@/app/api/pagos/[id]/applicable-notes/route'

import { fmtMXN } from '@/lib/formatters'

interface Props {
  payment: CustomerPayment
  onClose: () => void
  onApplied: () => void
}

export default function AplicarPagoANotasModal({ payment, onClose, onApplied }: Props) {
  const available = Number(payment.amount_available ?? 0)

  const [notes, setNotes]       = useState<ApplicableNote[]>([])
  const [loading, setLoading]   = useState(true)
  const [amounts, setAmounts]   = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Fetch applicable notes
  useEffect(() => {
    fetch(`/api/pagos/${payment.id}/applicable-notes`)
      .then(r => r.ok ? r.json() : [])
      .then((rows: ApplicableNote[]) => {
        setNotes(rows)
        // Initialize all amounts to 0
        const init: Record<string, string> = {}
        rows.forEach(n => { init[n.id] = '' })
        setAmounts(init)
      })
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [payment.id])

  const parsedAmounts = useMemo(() =>
    Object.fromEntries(
      Object.entries(amounts).map(([id, v]) => [id, parseFloat(v) || 0])
    ), [amounts])

  const totalAssigned = useMemo(
    () => Object.values(parsedAmounts).reduce((s, v) => s + v, 0),
    [parsedAmounts]
  )

  const remaining = Math.round((available - totalAssigned) * 100) / 100

  const setAmount = useCallback((noteId: string, val: string) => {
    setAmounts(prev => ({ ...prev, [noteId]: val }))
  }, [])

  // Fill a note with max applicable (min of balance and remaining)
  const fillNote = useCallback((note: ApplicableNote) => {
    const bal = Number(note.amount_balance)
    const rem = Math.max(0, Math.round((available - (totalAssigned - (parsedAmounts[note.id] || 0))) * 100) / 100)
    const fill = Math.min(bal, rem)
    setAmounts(prev => ({ ...prev, [note.id]: fill.toFixed(2) }))
  }, [available, totalAssigned, parsedAmounts])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const applications = notes
      .map(n => ({ note_id: n.id, amount: parsedAmounts[n.id] || 0 }))
      .filter(a => a.amount > 0.005)

    if (applications.length === 0) {
      setError('Asigna al menos un monto a una nota'); return
    }
    if (totalAssigned > available + 0.005) {
      setError(`El total asignado ($${fmtMXN(totalAssigned)}) supera el disponible ($${fmtMXN(available)})`); return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/pagos/${payment.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applications }),
      })
      if (res.ok) {
        onApplied()
        onClose()
      } else {
        const d = await res.json()
        setError(d.error ?? 'Error al aplicar')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const overBudget = totalAssigned > available + 0.005

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
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
            <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Aplicar pago a notas</h2>
            <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--c-ghost)' }}>
              {payment.number} · {payment.customer_name}
            </p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        {/* Budget bar */}
        <div className="rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between"
          style={{ background: 'var(--c-rim)' }}>
          <span className="text-xs" style={{ color: 'var(--c-ghost)' }}>Disponible en el pago</span>
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
                    <th className="px-3 py-1.5 text-right font-semibold" style={{ color: 'var(--c-ghost)' }}>APLICAR</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map(n => {
                    const bal = Number(n.amount_balance)
                    const isDraft = n.state === 'draft'
                    const amt = parsedAmounts[n.id] || 0
                    const tooMuch = amt > bal + 0.005
                    return (
                      <tr key={n.id} style={{ borderTop: '1px solid var(--c-rim)', opacity: isDraft ? 0.7 : 1 }}>
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
                          {isDraft ? (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FEF9EC', color: '#B45309' }}>
                              Borrador
                            </span>
                          ) : (
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
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {totalAssigned > 0.005 && (
                  <tfoot>
                    <tr style={{ background: 'var(--c-rim)', borderTop: '2px solid var(--c-ghost)' }}>
                      <td colSpan={3} className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--c-ghost)' }}>
                        TOTAL ASIGNADO
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
              {submitting ? 'Aplicando…' : 'Aplicar crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
