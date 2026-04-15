'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fmtMXN, fmtDate } from '@/lib/formatters'

interface ScheduleItem {
  due_date: string
  amount: string
  label: string
  overdue: boolean
}

interface InitialItem {
  due_date: string
  amount: string
  label: string | null
  state: string
  overdue: boolean
}

interface Props {
  saleId: string
  initialItems: InitialItem[]
}

const inputClass = 'px-2.5 py-1.5 rounded-lg text-xs outline-none'
const inputStyle = { background: 'var(--c-card)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }

function StateBadge({ state, overdue }: { state: string; overdue: boolean }) {
  if (state === 'paid') {
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#15803D' }}>Pagado</span>
  }
  if (overdue) {
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FFE4E6', color: '#BE123C' }}>Vencido</span>
  }
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#E0F2FE', color: '#0369A1' }}>Vigente</span>
}

export default function ScheduleModal({ saleId, initialItems }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const paidItems = useMemo(() => initialItems.filter(i => i.state === 'paid'), [initialItems])
  const [items, setItems] = useState<ScheduleItem[]>(
    initialItems
      .filter(i => i.state !== 'paid')
      .map(i => ({ due_date: i.due_date.slice(0, 10), amount: i.amount, label: i.label ?? '', overdue: i.overdue }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addItem() {
    setItems(prev => [...prev, { due_date: '', amount: '', label: '', overdue: false }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function update(idx: number, field: keyof ScheduleItem, value: string) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  async function handleSave() {
    setError(null)
    for (const item of items) {
      if (!item.due_date || !item.amount || isNaN(Number(item.amount))) {
        setError('Todos los ítems deben tener fecha e importe válido.')
        return
      }
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/sales/${saleId}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(i => ({ due_date: i.due_date, amount: Number(i.amount), label: i.label || null })) }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Error al guardar')
        return
      }
      setOpen(false)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const hasContent = paidItems.length > 0 || items.length > 0

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
        style={{ background: 'var(--c-navy)', color: '#fff' }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {initialItems.length > 0 ? 'Editar convenio' : 'Crear convenio'}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl p-6 flex flex-col gap-5 overflow-y-auto"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 8px 32px rgba(9,11,16,0.24)', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Convenio de Pago</h2>
              <button onClick={() => setOpen(false)} className="text-lg leading-none opacity-50 hover:opacity-100" style={{ color: 'var(--c-ghost)' }}>✕</button>
            </div>

            <div className="flex flex-col gap-2">
              {/* Column headers */}
              {hasContent && (
                <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr 80px auto' }}>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Fecha</span>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Importe</span>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Etiqueta</span>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Estado</span>
                  <span />
                </div>
              )}

              {/* Paid items — read-only */}
              {paidItems.map((item, idx) => (
                <div key={`paid-${idx}`} className="grid gap-2 items-center opacity-60" style={{ gridTemplateColumns: '1fr 1fr 1fr 80px auto' }}>
                  <span className="text-xs px-2.5 py-1.5" style={{ color: 'var(--c-ink)' }}>{fmtDate(item.due_date)}</span>
                  <span className="text-xs px-2.5 py-1.5 font-mono" style={{ color: 'var(--c-ink)' }}>${fmtMXN(item.amount)}</span>
                  <span className="text-xs px-2.5 py-1.5" style={{ color: 'var(--c-dim)' }}>{item.label || '—'}</span>
                  <StateBadge state="paid" overdue={false} />
                  <span />
                </div>
              ))}

              {/* Divider between paid and editable */}
              {paidItems.length > 0 && items.length > 0 && (
                <div style={{ borderTop: '1px dashed var(--c-rim)', margin: '2px 0' }} />
              )}

              {/* Editable pending items */}
              {items.length === 0 && paidItems.length === 0 && (
                <p className="text-sm py-3 text-center" style={{ color: 'var(--c-ghost)' }}>Sin ítems. Agrega el primer pago.</p>
              )}

              {items.map((item, idx) => (
                  <div key={idx} className="grid gap-2 items-center" style={{ gridTemplateColumns: '1fr 1fr 1fr 80px auto' }}>
                    <input
                      type="date"
                      className={inputClass + ' w-full'}
                      style={inputStyle}
                      value={item.due_date}
                      onChange={e => update(idx, 'due_date', e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={inputClass + ' w-full'}
                      style={inputStyle}
                      placeholder="0.00"
                      value={item.amount}
                      onChange={e => update(idx, 'amount', e.target.value)}
                    />
                    <input
                      type="text"
                      className={inputClass + ' w-full'}
                      style={inputStyle}
                      placeholder="Enganche, mensualidad…"
                      value={item.label}
                      onChange={e => update(idx, 'label', e.target.value)}
                    />
                    <StateBadge state="pending" overdue={item.overdue} />
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="opacity-40 hover:opacity-100 transition-opacity"
                      style={{ color: 'var(--c-rose)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                      </svg>
                    </button>
                  </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addItem}
              className="self-start text-xs font-semibold transition-opacity hover:opacity-75"
              style={{ color: 'var(--c-navy)' }}
            >
              + Agregar ítem
            </button>

            {error && <p className="text-xs" style={{ color: '#BE123C' }}>{error}</p>}

            <div className="flex gap-3 justify-end pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
                style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
                style={{ background: 'var(--c-navy)', color: '#fff' }}
              >
                {saving ? 'Guardando…' : 'Guardar convenio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
