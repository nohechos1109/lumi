'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import type { Sale } from '@/lib/queries/sales'

interface Props {
  sale: Sale
  role: string
}

type Mode = 'direct' | 'breakdown' | 'lines'

interface ProductLine {
  productId: string | null
  name: string
  qty: string
  unitPrice: string
}

interface ProductSuggestion {
  id: string
  name: string
  public_price: string
}

const IVA = 0.16

export default function NewNoteForm({ sale }: Props) {
  const router = useRouter()
  const [concept, setConcept] = useState('')
  const [mode, setMode] = useState<Mode>('direct')
  const [directTotal, setDirectTotal] = useState('')
  const [subtotal, setSubtotal] = useState('')
  const [lines, setLines] = useState<ProductLine[]>([{ productId: null, name: '', qty: '1', unitPrice: '' }])
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const searchProducts = useCallback(async (q: string, idx: number) => {
    if (q.length < 2) { setSuggestions([]); return }
    try {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setSuggestions(Array.isArray(data) ? data : [])
        setActiveLineIdx(idx)
      }
    } catch { /* ignore */ }
  }, [])

  function updateLine(idx: number, field: keyof ProductLine, value: string) {
    setLines(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
    if (field === 'name') searchProducts(value, idx)
    else setSuggestions([])
  }

  function selectProduct(idx: number, product: ProductSuggestion) {
    setLines(prev => prev.map((l, i) => i === idx
      ? { ...l, productId: product.id, name: product.name, unitPrice: product.public_price }
      : l
    ))
    setSuggestions([])
    setActiveLineIdx(null)
  }

  function addLine() {
    setLines(prev => [...prev, { productId: null, name: '', qty: '1', unitPrice: '' }])
  }

  function removeLine(idx: number) {
    setLines(prev => prev.filter((_, i) => i !== idx))
  }

  function computeAmounts(): { untaxed: number; tax: number; total: number } | null {
    if (mode === 'direct') {
      const t = Number(directTotal)
      if (!t || t <= 0) return null
      const u = t / (1 + IVA)
      return { untaxed: u, tax: t - u, total: t }
    }
    if (mode === 'breakdown') {
      const u = Number(subtotal)
      if (!u || u <= 0) return null
      const tax = u * IVA
      return { untaxed: u, tax, total: u + tax }
    }
    const validLines = lines.filter(l => l.name && Number(l.qty) > 0 && Number(l.unitPrice) > 0)
    if (validLines.length === 0) return null
    const total = validLines.reduce((sum, l) => sum + Number(l.qty) * Number(l.unitPrice), 0)
    const u = total / (1 + IVA)
    return { untaxed: u, tax: total - u, total }
  }

  const amounts = computeAmounts()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amounts) {
      toast('El total debe ser mayor a 0', 'error')
      return
    }

    let apiLines: object[] | undefined
    if (mode === 'lines') {
      apiLines = lines
        .filter(l => l.name && Number(l.qty) > 0 && Number(l.unitPrice) > 0)
        .map(l => {
          const lineTotal = Number(l.qty) * Number(l.unitPrice)
          const lineUntaxed = lineTotal / (1 + IVA)
          return {
            product_id: l.productId,
            name: l.name,
            qty: Number(l.qty),
            unit_price_mxn: Number(l.unitPrice),
            subtotal: lineUntaxed,
            tax_amount: lineTotal - lineUntaxed,
            total: lineTotal,
          }
        })
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/sales/${sale.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: concept || null,
          amount_untaxed: amounts.untaxed,
          amount_tax: amounts.tax,
          amount_total: amounts.total,
          lines: apiLines,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        toast(d.error ?? 'Error al crear nota', 'error')
        return
      }

      toast('Nota creada')
      router.push(`/ventas/${sale.id}`)
    } catch {
      toast('Error al crear nota', 'error')
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

  const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const MODES: { key: Mode; label: string }[] = [
    { key: 'direct', label: 'Monto directo' },
    { key: 'breakdown', label: 'Con IVA' },
    { key: 'lines', label: 'Por líneas' },
  ]

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-6">

      {/* Concepto */}
      <div
        className="rounded-xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Concepto</label>
          <input
            type="text"
            value={concept}
            onChange={e => setConcept(e.target.value)}
            className="text-sm rounded-lg px-3 py-2.5"
            style={inputStyle}
            placeholder="Ej: Anticipo, Segunda entrega, Saldo final..."
          />
        </div>
      </div>

      {/* Monto */}
      <div
        className="rounded-xl p-5 flex flex-col gap-4"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--c-ghost)' }}>Monto</p>
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg mb-4" style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)' }}>
            {MODES.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className="flex-1 text-xs font-semibold py-2 rounded-md transition-colors"
                style={{
                  background: mode === m.key ? 'var(--c-navy)' : 'transparent',
                  color: mode === m.key ? '#fff' : 'var(--c-ghost)',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Mode: direct */}
          {mode === 'direct' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Total (con IVA) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={directTotal}
                  onChange={e => setDirectTotal(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2.5"
                  style={inputStyle}
                  placeholder="0.00"
                />
              </div>
              {amounts && (
                <div className="grid grid-cols-2 gap-2 text-xs rounded-lg p-3" style={{ background: 'var(--c-panel)', color: 'var(--c-ghost)' }}>
                  <span>Subtotal:</span><span className="text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(amounts.untaxed)}</span>
                  <span>IVA (16%):</span><span className="text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(amounts.tax)}</span>
                </div>
              )}
            </div>
          )}

          {/* Mode: breakdown */}
          {mode === 'breakdown' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Subtotal (sin IVA) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={subtotal}
                  onChange={e => setSubtotal(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2.5"
                  style={inputStyle}
                  placeholder="0.00"
                />
              </div>
              {amounts && (
                <div className="grid grid-cols-2 gap-2 text-xs rounded-lg p-3" style={{ background: 'var(--c-panel)', color: 'var(--c-ghost)' }}>
                  <span>IVA (16%):</span><span className="text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(amounts.tax)}</span>
                  <span className="font-semibold" style={{ color: 'var(--c-ink)' }}>Total:</span><span className="text-right font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>${fmt(amounts.total)}</span>
                </div>
              )}
            </div>
          )}

          {/* Mode: lines */}
          {mode === 'lines' && (
            <div className="flex flex-col gap-3">
              <div className="grid text-xs font-semibold uppercase tracking-wider px-1 gap-2" style={{ gridTemplateColumns: '1fr 4rem 7rem 5rem 1.5rem', color: 'var(--c-ghost)' }}>
                <span>Producto / descripción</span>
                <span className="text-center">Qty</span>
                <span>Precio unit.</span>
                <span className="text-right">Total</span>
                <span />
              </div>
              <div className="flex flex-col gap-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="relative grid gap-2 items-start" style={{ gridTemplateColumns: '1fr 4rem 7rem 5rem 1.5rem' }}>
                    <div className="relative">
                      <input
                        type="text"
                        value={line.name}
                        onChange={e => updateLine(idx, 'name', e.target.value)}
                        className="text-sm rounded-lg px-3 py-2 w-full"
                        style={inputStyle}
                        placeholder="Buscar producto..."
                      />
                      {suggestions.length > 0 && activeLineIdx === idx && (
                        <div
                          className="absolute top-full left-0 right-0 z-10 rounded-lg overflow-hidden shadow-lg"
                          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
                        >
                          {suggestions.slice(0, 5).map(s => (
                            <button
                              key={s.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-xs hover:opacity-75 transition-opacity flex justify-between"
                              style={{ color: 'var(--c-ink)', borderBottom: '1px solid var(--c-rim)' }}
                              onClick={() => selectProduct(idx, s)}
                            >
                              <span>{s.name}</span>
                              <span style={{ color: 'var(--c-ghost)' }}>${Number(s.public_price).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      value={line.qty}
                      onChange={e => updateLine(idx, 'qty', e.target.value)}
                      className="text-sm rounded-lg px-2 py-2 text-center"
                      style={inputStyle}
                      placeholder="1"
                      min="0.01"
                      step="0.01"
                    />
                    <input
                      type="number"
                      value={line.unitPrice}
                      onChange={e => updateLine(idx, 'unitPrice', e.target.value)}
                      className="text-sm rounded-lg px-2 py-2"
                      style={inputStyle}
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                    <span className="text-xs font-mono pt-2.5 text-right" style={{ color: 'var(--c-ghost)' }}>
                      {line.qty && line.unitPrice ? `$${fmt(Number(line.qty) * Number(line.unitPrice))}` : '—'}
                    </span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="pt-2 text-xs transition-opacity hover:opacity-75"
                        style={{ color: '#BE123C' }}
                      >✕</button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addLine}
                className="text-xs font-semibold transition-opacity hover:opacity-75 text-left"
                style={{ color: 'var(--c-navy)' }}
              >
                + Agregar línea
              </button>
              {amounts && (
                <div className="grid grid-cols-2 gap-2 text-xs rounded-lg p-3 mt-1" style={{ background: 'var(--c-panel)', color: 'var(--c-ghost)' }}>
                  <span>Subtotal:</span><span className="text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(amounts.untaxed)}</span>
                  <span>IVA (16%):</span><span className="text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(amounts.tax)}</span>
                  <span className="font-semibold" style={{ color: 'var(--c-ink)' }}>Total:</span><span className="text-right font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>${fmt(amounts.total)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.push(`/ventas/${sale.id}`)}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-75"
          style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading || !amounts}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: 'var(--c-navy)', color: '#fff' }}
        >
          {loading ? 'Creando...' : 'Crear Nota'}
        </button>
      </div>
    </form>
  )
}
