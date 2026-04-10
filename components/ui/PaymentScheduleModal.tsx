'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'

interface ScheduleItem {
  due_date: string
  amount: string | number
  label: string | null
  sequence: number
}

interface Props {
  saleId: string
  saleTotal: number
  currentSchedule: ScheduleItem[]
  onClose: () => void
  onSaved: () => void
}

interface Row {
  due_date: string
  amount: string
  label: string
}

export default function PaymentScheduleModal({ saleId, saleTotal, currentSchedule, onClose, onSaved }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const [rows, setRows] = useState<Row[]>(() => {
    if (currentSchedule.length > 0) {
      return currentSchedule.map(s => ({
        due_date: typeof s.due_date === 'string' ? s.due_date.slice(0, 10) : s.due_date,
        amount: String(s.amount),
        label: s.label ?? '',
      }))
    }
    return [{ due_date: new Date().toISOString().slice(0, 10), amount: '', label: 'Anticipo' }]
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const totalScheduled = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0)
  const diff = saleTotal - totalScheduled

  function addRow() {
    setRows([...rows, { due_date: '', amount: '', label: '' }])
  }

  function removeRow(i: number) {
    setRows(rows.filter((_, idx) => idx !== i))
  }

  function updateRow(i: number, field: keyof Row, value: string) {
    const updated = [...rows]
    updated[i] = { ...updated[i], [field]: value }
    setRows(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const items = rows
      .filter(r => r.due_date && r.amount && Number(r.amount) > 0)
      .map(r => ({
        due_date: r.due_date,
        amount: Number(r.amount),
        label: r.label || undefined,
      }))

    if (items.length === 0) {
      toast('Agrega al menos una parcialidad', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/sales/${saleId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })

      if (!res.ok) {
        const d = await res.json()
        toast(d.error ?? 'Error al guardar convenio', 'error')
        return
      }

      onSaved()
    } catch {
      toast('Error al guardar convenio', 'error')
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

  const fmt = (v: number) => v.toLocaleString('es-MX', { minimumFractionDigits: 2 })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold" style={{ color: 'var(--c-ink)' }}>Convenio de Pago</h2>

        <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>
          Total de la venta: <strong className="font-mono">${fmt(saleTotal)}</strong>
        </p>

        {/* Rows */}
        <div className="flex flex-col gap-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_100px_1fr_28px] gap-2 items-end">
              <div>
                {i === 0 && <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--c-ghost)' }}>Fecha</label>}
                <input
                  type="date"
                  value={row.due_date}
                  onChange={e => updateRow(i, 'due_date', e.target.value)}
                  min={today}
                  className="text-sm rounded-lg px-2 py-1.5 w-full"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                {i === 0 && <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--c-ghost)' }}>Importe</label>}
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={row.amount}
                  onChange={e => updateRow(i, 'amount', e.target.value)}
                  className="text-sm rounded-lg px-2 py-1.5 w-full"
                  style={inputStyle}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                {i === 0 && <label className="text-[10px] font-semibold uppercase tracking-wider block mb-1" style={{ color: 'var(--c-ghost)' }}>Etiqueta</label>}
                <input
                  type="text"
                  value={row.label}
                  onChange={e => updateRow(i, 'label', e.target.value)}
                  className="text-sm rounded-lg px-2 py-1.5 w-full"
                  style={inputStyle}
                  placeholder={`Pago ${i + 1}`}
                />
              </div>
              <button
                type="button"
                onClick={() => removeRow(i)}
                className="text-sm rounded-lg px-1 py-1.5 transition-opacity hover:opacity-60"
                style={{ color: '#BE123C' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addRow}
          className="text-sm font-semibold transition-opacity hover:opacity-80 self-start"
          style={{ color: '#059669' }}
        >
          + Agregar parcialidad
        </button>

        {/* Total bar */}
        <div className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)' }}>
          <span className="text-xs font-semibold" style={{ color: 'var(--c-ghost)' }}>Total programado</span>
          <span className="font-mono text-sm font-bold" style={{ color: Math.abs(diff) < 0.01 ? '#15803D' : '#B45309' }}>
            ${fmt(totalScheduled)}
            {Math.abs(diff) >= 0.01 && (
              <span className="text-xs ml-2 font-normal" style={{ color: '#B45309' }}>
                ({diff > 0 ? `faltan $${fmt(diff)}` : `excede $${fmt(-diff)}`})
              </span>
            )}
          </span>
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
            disabled={loading || rows.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: '#059669', color: '#fff' }}
          >
            {loading ? 'Guardando...' : 'Guardar Convenio'}
          </button>
        </div>
      </form>
    </div>
  )
}
