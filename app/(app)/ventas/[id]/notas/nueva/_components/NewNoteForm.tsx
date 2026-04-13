'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import type { Sale } from '@/lib/queries/sales'

interface QuoteLineCoverage {
  quote_line_id: string
  product_id: string | null
  name: string
  qty_quoted: number
  qty_used: number    // already in other notes for this unit
  qty_remaining: number
}

interface Props {
  sale: Sale
  role: string
  quoteLines?: {
    id: string
    product_id: string | null
    name: string
    qty: string | null
    unit_price_mxn_effective: string
    discount_percent: string
  }[]
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

interface Unidad { id: string; name: string; ruta_name?: string }

const IVA = 0.16
const fmt = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function NewNoteForm({ sale, quoteLines = [] }: Props) {
  const router = useRouter()
  const [concept, setConcept] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [unitId, setUnitId] = useState('')
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [coverage, setCoverage] = useState<QuoteLineCoverage[]>([])
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [lines, setLines] = useState<ProductLine[]>([{ productId: null, name: '', qty: '1', unitPrice: '' }])
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  // Load unidades on mount
  useEffect(() => {
    fetch('/api/unidades').then(r => r.json()).then(d => setUnidades(Array.isArray(d) ? d : []))
  }, [])

  // Load per-unit coverage when unit changes
  useEffect(() => {
    if (!unitId || quoteLines.length === 0) { setCoverage([]); return }
    setCoverageLoading(true)
    fetch(`/api/sales/${sale.id}/unit-coverage?unit_id=${unitId}`)
      .then(r => r.json())
      .then(d => setCoverage(Array.isArray(d) ? d : []))
      .catch(() => setCoverage([]))
      .finally(() => setCoverageLoading(false))
  }, [unitId, sale.id, quoteLines.length])

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
    const quoteMatch = quoteLines.find(ql => ql.product_id === product.id)
    const price = quoteMatch
      ? String(parseFloat(quoteMatch.unit_price_mxn_effective) * (1 - (parseFloat(quoteMatch.discount_percent) || 0) / 100))
      : product.public_price ? String(parseFloat(product.public_price)) : ''
    setLines(prev => prev.map((l, i) => i === idx
      ? { ...l, productId: product.id, name: product.name, unitPrice: price }
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

  // Build displayed quote lines: use coverage (per-unit) if unit selected, else raw quoteLines
  const displayLines: { id: string; product_id: string | null; name: string; maxQty: number; usedElsewhere: number; unitPrice: number }[] =
    unitId && coverage.length > 0
      ? coverage.map(c => {
          const ql = quoteLines.find(q => q.id === c.quote_line_id)
          const discount = parseFloat(ql?.discount_percent ?? '0') || 0
          const unitPrice = ql ? parseFloat(ql.unit_price_mxn_effective) * (1 - discount / 100) : 0
          return { id: c.quote_line_id, product_id: c.product_id, name: c.name, maxQty: c.qty_remaining, usedElsewhere: c.qty_used, unitPrice }
        })
      : quoteLines.map(ql => {
          const discount = parseFloat(ql.discount_percent) || 0
          return { id: ql.id, product_id: ql.product_id, name: ql.name, maxQty: Number(ql.qty ?? 1), usedElsewhere: 0, unitPrice: parseFloat(ql.unit_price_mxn_effective) * (1 - discount / 100) }
        })

  // Track qty used in current form per quote line
  const usedQtyByQuoteLine: Record<string, number> = {}
  for (const line of lines) {
    if (line.quoteLineId) {
      usedQtyByQuoteLine[line.quoteLineId] = (usedQtyByQuoteLine[line.quoteLineId] ?? 0) + Number(line.qty || 0)
    }
  }

  function addFromQuote(dl: typeof displayLines[number]) {
    const usedNow = usedQtyByQuoteLine[dl.id] ?? 0
    const remaining = dl.maxQty - usedNow
    if (remaining <= 0) return
    setLines(prev => {
      const existingIdx = prev.findIndex(l => l.quoteLineId === dl.id)
      if (existingIdx >= 0) {
        return prev.map((l, i) => i === existingIdx
          ? { ...l, qty: String(parseFloat(l.qty || '0') + 1) }
          : l
        )
      }
      const newLine: ProductLine = { productId: dl.product_id, quoteLineId: dl.id, name: dl.name, qty: '1', unitPrice: String(dl.unitPrice) }
      if (prev.length === 1 && !prev[0].name && !prev[0].unitPrice) return [newLine]
      return [...prev, newLine]
    })
  }

  function computeAmounts() {
    const validLines = lines.filter(l => l.name && Number(l.qty) > 0 && Number(l.unitPrice) > 0)
    if (validLines.length === 0) return null
    const untaxed = validLines.reduce((sum, l) => sum + Number(l.qty) * Number(l.unitPrice), 0)
    const tax = untaxed * IVA
    return { untaxed, tax, total: untaxed + tax }
  }

  const amounts = computeAmounts()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!amounts) { toast('Agrega al menos una línea con monto', 'error'); return }

    const apiLines = lines
      .filter(l => l.name && Number(l.qty) > 0 && Number(l.unitPrice) > 0)
      .map(l => {
        const lineUntaxed = Number(l.qty) * Number(l.unitPrice)
        const lineTax = lineUntaxed * IVA
        return {
          product_id: l.productId,
          quote_line_id: l.quoteLineId ?? null,
          name: l.name,
          qty: Number(l.qty),
          unit_price_mxn: Number(l.unitPrice),
          subtotal: lineUntaxed,
          tax_amount: lineTax,
          total: lineUntaxed + lineTax,
        }
      })

    setLoading(true)
    try {
      const res = await fetch(`/api/sales/${sale.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: concept || null,
          unit_id: unitId || null,
          observaciones: observaciones || null,
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

  const hasQuoteLines = quoteLines.length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">

      {/* Datos de la nota */}
      <div className="rounded-xl p-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
              Unidad
            </label>
            <select
              value={unitId}
              onChange={e => setUnitId(e.target.value)}
              className="text-sm rounded-lg px-3 py-2.5"
              style={inputStyle}
            >
              <option value="">Sin unidad</option>
              {unidades.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}{u.ruta_name ? ` — ${u.ruta_name}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
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
          <div className="flex flex-col gap-1.5 md:col-span-4">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Observaciones</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              rows={2}
              className="text-sm rounded-lg px-3 py-2.5 resize-none"
              style={inputStyle}
              placeholder="Notas internas sobre esta nota..."
            />
          </div>
        </div>
      </div>

      {/* Two-column lines layout */}
      <div className="grid gap-5" style={{ gridTemplateColumns: hasQuoteLines ? '320px 1fr' : '1fr' }}>

        {/* Left: Quote products picker */}
        {hasQuoteLines && (
          <div className="rounded-xl flex flex-col" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
            <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--c-rim)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
                Productos de la cotización
                {unitId && <span className="ml-1 normal-case font-normal">(pendientes para esta unidad)</span>}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {coverageLoading && (
                <p className="px-4 py-3 text-xs" style={{ color: 'var(--c-ghost)' }}>Cargando...</p>
              )}
              {!coverageLoading && displayLines.map(dl => {
                const usedNow = usedQtyByQuoteLine[dl.id] ?? 0
                const remaining = dl.maxQty - usedNow
                const exhausted = remaining <= 0
                return (
                  <button
                    key={dl.id}
                    type="button"
                    onClick={() => !exhausted && addFromQuote(dl)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-opacity"
                    style={{
                      borderBottom: '1px solid var(--c-rim)',
                      opacity: exhausted ? 0.4 : 1,
                      cursor: exhausted ? 'default' : 'pointer',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight truncate" style={{ color: 'var(--c-ink)' }}>{dl.name}</p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--c-ghost)' }}>
                        ×{dl.maxQty.toLocaleString('es-MX')} · ${dl.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        {unitId && dl.usedElsewhere > 0 && (
                          <span style={{ color: 'var(--c-dim)', marginLeft: 6 }}>({dl.usedElsewhere} en otras notas)</span>
                        )}
                        {usedNow > 0 && !exhausted && (
                          <span style={{ color: 'var(--c-navy)', marginLeft: 6 }}>({usedNow} agregado{usedNow !== 1 ? 's' : ''})</span>
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
        <div className="rounded-xl flex flex-col" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
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
                <div key={idx} className="relative grid gap-2 items-start" style={{ gridTemplateColumns: '1fr 5rem 8rem 6rem 1.5rem' }}>
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
                      <div className="absolute top-full left-0 right-0 z-10 rounded-lg overflow-hidden shadow-lg" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
                        {suggestions.slice(0, 5).map(s => (
                          <button key={s.id} type="button"
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
                  <input type="number" value={line.qty}
                    onChange={e => updateLine(idx, 'qty', e.target.value)}
                    className="text-sm rounded-lg px-2 py-2 text-center"
                    style={inputStyle} placeholder="1" min="0.01" step="0.01"
                  />
                  <input type="number" value={line.unitPrice}
                    onChange={e => updateLine(idx, 'unitPrice', e.target.value)}
                    className="text-sm rounded-lg px-2 py-2"
                    style={inputStyle} placeholder="0.00" min="0" step="0.01"
                  />
                  <span className="text-xs font-mono pt-2.5 text-right" style={{ color: 'var(--c-ghost)' }}>
                    {line.qty && line.unitPrice ? `$${fmt(Number(line.qty) * Number(line.unitPrice))}` : '—'}
                  </span>
                  {lines.length > 1 && (
                    <button type="button" onClick={() => removeLine(idx)}
                      className="pt-2 text-xs transition-opacity hover:opacity-75" style={{ color: '#BE123C' }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={addLine}
              className="text-xs font-semibold transition-opacity hover:opacity-75 text-left"
              style={{ color: 'var(--c-navy)' }}>
              + Agregar línea
            </button>
          </div>

          {amounts && (
            <div className="px-4 py-3 border-t grid gap-x-8 gap-y-1 text-xs"
              style={{ borderColor: 'var(--c-rim)', gridTemplateColumns: '1fr auto' }}>
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
        <button type="button" onClick={() => router.push(`/ventas/${sale.id}`)} disabled={loading}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-75"
          style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}>
          Cancelar
        </button>
        <button type="submit" disabled={loading || !amounts}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: 'var(--c-navy)', color: '#fff' }}>
          {loading ? 'Creando...' : 'Crear Nota'}
        </button>
      </div>
    </form>
  )
}
