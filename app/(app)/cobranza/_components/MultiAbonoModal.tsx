'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'

const METHODS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo',      label: 'Efectivo' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'tarjeta',       label: 'Tarjeta' },
  { value: 'otro',          label: 'Otro' },
]

export interface SelectedNote {
  id: string
  remision: string
  amount_balance: string
}

interface Props {
  customerId: string
  customerName: string
  notes: SelectedNote[]
  onClose: () => void
  onCreated: () => void
}

const fmtMXN = (n: number) =>
  n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Distribute `total` evenly across notes.
 * Each round: share = remaining / activeNotes. Notes whose balance < share
 * get capped at their balance; the leftover is redistributed equally among
 * the rest. The last uncapped note absorbs any rounding remainder.
 */
function evenDistribute(total: number, balances: number[]): number[] {
  const r100 = (n: number) => Math.round(n * 100) / 100
  const result = new Array(balances.length).fill(0)
  let remaining = r100(total)
  const active = new Set(balances.map((_, i) => i))

  while (remaining > 0.005 && active.size > 0) {
    const share = remaining / active.size
    let anyCapped = false

    for (const i of Array.from(active)) {
      const bal = r100(balances[i] - result[i])
      if (bal <= share + 0.005) {
        result[i] = r100(result[i] + bal)
        remaining = r100(remaining - bal)
        active.delete(i)
        anyCapped = true
      }
    }

    if (!anyCapped) {
      const arr = Array.from(active)
      for (let k = 0; k < arr.length - 1; k++) {
        const take = r100(share)
        result[arr[k]] = r100(result[arr[k]] + take)
        remaining = r100(remaining - take)
      }
      // Last note absorbs rounding remainder
      result[arr[arr.length - 1]] = r100(result[arr[arr.length - 1]] + remaining)
      remaining = 0
      break
    }
  }

  return result
}

export default function MultiAbonoModal({ customerId, customerName, notes, onClose, onCreated }: Props) {
  const totalBalance = useMemo(
    () => notes.reduce((s, n) => s + Number(n.amount_balance), 0),
    [notes]
  )

  const [amount, setAmount]   = useState(fmtMXN(totalBalance))
  const [method, setMethod]   = useState('transferencia')
  const [date, setDate]       = useState(() => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm   = String(d.getMonth() + 1).padStart(2, '0')
    const dd   = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  })
  const [concept, setConcept] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // Per-note amounts (string state for free editing)
  const [distribution, setDistribution] = useState<string[]>(() => {
    const balances = notes.map(n => Number(n.amount_balance))
    return evenDistribute(totalBalance, balances).map(v => fmtMXN(v))
  })

  // Recompute cascade when amount changes (but only if user hasn't manually tweaked)
  const [autoMode, setAutoMode] = useState(true)

  useEffect(() => {
    if (!autoMode) return
    const n = parseFloat(amount.replace(/,/g, '')) || 0
    const balances = notes.map(nt => Number(nt.amount_balance))
    const next = evenDistribute(n, balances).map(v => fmtMXN(v))
    setDistribution(next)
  }, [amount, autoMode, notes])

  const parsedTotal = parseFloat(amount.replace(/,/g, '')) || 0
  const parsedDistribution = distribution.map(s => parseFloat(s.replace(/,/g, '')) || 0)
  const distSum = parsedDistribution.reduce((s, v) => s + v, 0)
  const sumMismatch = Math.abs(parsedTotal - distSum) > 0.01

  const updateLine = useCallback((idx: number, val: string) => {
    setAutoMode(false)
    setDistribution(prev => prev.map((v, i) => i === idx ? val : v))
  }, [])

  const resetCascade = useCallback(() => {
    setAutoMode(true)
    const balances = notes.map(n => Number(n.amount_balance))
    const next = evenDistribute(parsedTotal, balances).map(v => fmtMXN(v))
    setDistribution(next)
  }, [notes, parsedTotal])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!parsedTotal || parsedTotal <= 0) {
      setError('Ingresa un monto total válido')
      return
    }
    if (parsedTotal > totalBalance + 0.005) {
      setError(`El total excede el saldo combinado ($${fmtMXN(totalBalance)})`)
      return
    }
    if (sumMismatch) {
      setError(`La suma de abonos ($${fmtMXN(distSum)}) no coincide con el total ($${fmtMXN(parsedTotal)})`)
      return
    }
    // Per-line validation
    for (let i = 0; i < notes.length; i++) {
      const amt = parsedDistribution[i]
      const bal = Number(notes[i].amount_balance)
      if (amt > bal + 0.005) {
        setError(`El abono a ${notes[i].remision} excede su saldo ($${fmtMXN(bal)})`)
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch('/api/cobranza/abono-multiple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          total: parsedTotal,
          payment_method: method,
          payment_date: date,
          concept: concept || null,
          applications: notes.map((n, i) => ({
            noteId: n.id,
            amount: parsedDistribution[i],
          })),
        }),
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
        className="w-full max-w-xl rounded-2xl p-6 flex flex-col"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(27,52,97,0.18)',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Abonar a varias notas</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
              {customerName} · {notes.length} nota{notes.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        <div className="rounded-lg px-4 py-2.5 mb-5 text-sm flex justify-between items-center"
          style={{ background: 'var(--c-rim)' }}>
          <span style={{ color: 'var(--c-ghost)' }}>Saldo combinado</span>
          <span className="font-bold font-mono" style={{ color: '#B45309' }}>${fmtMXN(totalBalance)}</span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto">

          {/* Total + Método + Fecha */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>MONTO TOTAL</label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>FECHA</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>MÉTODO</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={inputStyle}
              >
                {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>CONCEPTO (opcional)</label>
              <input
                type="text"
                value={concept}
                onChange={e => setConcept(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={inputStyle}
              />
            </div>
          </div>

          {/* Distribución */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold" style={{ color: 'var(--c-ghost)' }}>
                DISTRIBUCIÓN {autoMode && <span style={{ color: '#059669' }}>· auto</span>}
              </label>
              {!autoMode && (
                <button type="button" onClick={resetCascade}
                  className="text-xs font-semibold hover:opacity-75"
                  style={{ color: 'var(--c-navy)' }}>
                  Auto-distribuir
                </button>
              )}
            </div>

            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-rim)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--c-rim)' }}>
                    <th className="px-3 py-1.5 text-left font-semibold" style={{ color: 'var(--c-ghost)' }}>REMISIÓN</th>
                    <th className="px-3 py-1.5 text-right font-semibold" style={{ color: 'var(--c-ghost)' }}>SALDO</th>
                    <th className="px-3 py-1.5 text-right font-semibold" style={{ color: 'var(--c-ghost)' }}>ABONO</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((n, i) => {
                    const balance = Number(n.amount_balance)
                    const amt = parsedDistribution[i] ?? 0
                    const tooMuch = amt > balance + 0.005
                    return (
                      <tr key={n.id} style={{ borderTop: '1px solid var(--c-rim)' }}>
                        <td className="px-3 py-2 font-mono font-medium" style={{ color: 'var(--c-ink)' }}>{n.remision}</td>
                        <td className="px-3 py-2 text-right font-mono" style={{ color: '#B45309' }}>${fmtMXN(balance)}</td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={distribution[i] ?? '0.00'}
                            onChange={e => updateLine(i, e.target.value)}
                            className="w-24 rounded px-2 py-1 text-xs font-mono text-right"
                            style={{
                              background: 'var(--c-rim)',
                              border: `1px solid ${tooMuch ? '#BE123C' : 'var(--c-rim)'}`,
                              color: tooMuch ? '#BE123C' : 'var(--c-ink)',
                              outline: 'none',
                            }}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: 'var(--c-rim)', borderTop: '2px solid var(--c-ghost)' }}>
                    <td className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--c-ghost)' }}>SUMA</td>
                    <td></td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-xs"
                      style={{ color: sumMismatch ? '#BE123C' : '#15803D' }}>
                      ${fmtMXN(distSum)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
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
              disabled={loading || sumMismatch}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
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

const inputStyle: React.CSSProperties = {
  background: 'var(--c-rim)',
  border: '1px solid var(--c-rim)',
  color: 'var(--c-ink)',
  outline: 'none',
}
