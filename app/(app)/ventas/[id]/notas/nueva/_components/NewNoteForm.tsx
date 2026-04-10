'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import type { Sale } from '@/lib/queries/sales'

interface QuoteLine {
  id: string
  product_id: string | null
  name: string
  qty: string | null
  unit_price_mxn_effective: string
}

interface Props {
  sale: Sale
  role: string
  quoteLines?: QuoteLine[]
}

interface ProductLine {
  productId: string | null
  quoteLineId?: string
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
const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function NewNoteForm({ sale, quoteLines = [] }: Props) {
  const router = useRouter()
  const [concept, setConcept] = useState('')
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

  function addFromQuote(ql: QuoteLine) {
    const unitPrice = String(parseFloat(ql.unit_price_mxn_effective))
    setLines(prev => {
      // If there's already a line from this quote product, increment qty by 1
      const existingIdx = prev.findIndex(l => l.quoteLineId === ql.id)
      if (existingIdx >= 0) {
        return prev.map((l, i) => i === existingIdx
          ? { ...l, qty: String(parseFloat(l.qty || '0') + 1) }
          : l
        )
      }
      // Otherwise add new line with qty=1, replacing empty placeholder if present
      const newLine: ProductLine = {
        productId: ql.product_id,
        quoteLineId: ql.id,
        name: ql.name,
        qty: '1',
        unitPrice,
      }
      if (prev.length === 1 && !prev[0].name && !prev[0].unitPrice) return [newLine]
      return [...prev, newLine]
    })
  }

  // Compute used qty per quote line
  const usedQtyByQuoteLine: Record<string, number> = {}
  for (const line of lines) {
    if (line.quoteLineId) {
      usedQtyByQuoteLine[line.quoteLineId] = (usedQtyByQuoteLine[line.quoteLineId] ?? 0) + Number(line.qty || 0)
    }
  }

  function computeAmounts(): { untaxed: number; tax: number; total: number } | null {
    const validLines = lines.filter(l => l.name && Number(l.qty) > 0 && Number(l.unitPrice) > 0)
    if (validLines.length === 0) return null
    const total = validLines.reduce((sum, l) => sum + Number(l.qty) * Number(l.unitPrice), 0)
    const u = total / (1 + IVA)
    return { untaxed: u, tax: total - u, total }
  }

  const amounts = computeAmounts()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amounts) { toast('Agrega al menos una línea con monto', 'error'); return }

    const apiLines = lines
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Concepto */}
      <div
        className="rounded-xl p-4"
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

      {/* Two-column lines layout */}
      <div className="grid gap-5" style={{ gridTemplateColumns: quoteLines.length > 0 ? '320px 1fr' : '1fr' }}>

        {/* Left: Quote products picker */}
        {quoteLines.length > 0 && (
          <div
            className="rounded-xl flex flex-col"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--c-rim)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
                Productos de la cotización
              </p>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {quoteLines.map(ql => {
                const maxQty = Number(ql.qty ?? 1)
                const usedQty = usedQtyByQuoteLine[ql.id] ?? 0
                const exhausted = usedQty >= maxQty
                return (
                  <button
                    key={ql.id}
                    type="button"
                    onClick={() => !exhausted && addFromQuote(ql)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-opacity"
                    style={{
                      borderBottom: '1px solid var(--c-rim)',
                      opacity: exhausted ? 0.4 : 1,
                      cursor: exhausted ? 'default' : 'pointer',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight truncate" style={{ color: 'var(--c-ink)' }}>{ql.name}</p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--c-ghost)' }}>
                        ×{maxQty.toLocaleString('es-MX')} · ${Number(ql.unit_price_mxn_effective).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        {usedQty > 0 && !exhausted && (
                          <span style={{ color: 'var(--c-navy)', marginLeft: 6 }}>({usedQty} agregado{usedQty !== 1 ? 's' : ''})</span>
                        )}
                        {exhausted && <span style={{ marginLeft: 6 }}>✓ completo</span>}
                      </p>
                    </div>
                    <span
                      className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
                      style={{ background: exhausted ? 'var(--c-rim)' : 'var(--c-navy)', color: exhausted ? 'var(--c-ghost)' : '#fff' }}
                    >{exhausted ? '✓' : '+'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Right: Lines table + totals */}
        <div
          className="rounded-xl flex flex-col"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--c-rim)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Líneas de la nota</p>
          </div>

          <div className="flex-1 p-4 flex flex-col gap-3">
            <div
              className="grid text-xs font-semibold uppercase tracking-wider px-1 gap-2"
              style={{ gridTemplateColumns: '1fr 5rem 8rem 6rem 1.5rem', color: 'var(--c-ghost)' }}
            >
              <span>Descripción</span>
              <span className="text-center">Qty</span>
              <span>Precio unit.</span>
              <span className="text-right">Total</span>
              <span />
            </div>

            <div className="flex flex-col gap-2">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="relative grid gap-2 items-start"
                  style={{ gridTemplateColumns: '1fr 5rem 8rem 6rem 1.5rem' }}
                >
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
                    type="number" value={line.qty}
                    onChange={e => updateLine(idx, 'qty', e.target.value)}
                    className="text-sm rounded-lg px-2 py-2 text-center"
                    style={inputStyle} placeholder="1" min="0.01" step="0.01"
                  />
                  <input
                    type="number" value={line.unitPrice}
                    onChange={e => updateLine(idx, 'unitPrice', e.target.value)}
                    className="text-sm rounded-lg px-2 py-2"
                    style={inputStyle} placeholder="0.00" min="0" step="0.01"
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
          </div>

          {amounts && (
            <div
              className="px-4 py-3 border-t grid gap-x-8 gap-y-1 text-xs"
              style={{ borderColor: 'var(--c-rim)', gridTemplateColumns: '1fr auto' }}
            >
              <span style={{ color: 'var(--c-ghost)' }}>Subtotal</span>
              <span className="text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(amounts.untaxed)}</span>
              <span style={{ color: 'var(--c-ghost)' }}>IVA (16%)</span>
              <span className="text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(amounts.tax)}</span>
              <span className="font-semibold text-sm" style={{ color: 'var(--c-ink)' }}>Total</span>
              <span className="text-right font-mono font-semibold text-sm" style={{ color: 'var(--c-ink)' }}>${fmt(amounts.total)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
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
