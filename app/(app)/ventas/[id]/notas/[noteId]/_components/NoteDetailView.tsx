'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from '@/lib/toast'

interface SaleNote {
  id: string
  number: string
  state: 'draft' | 'confirmed' | 'cancelled' | 'paid'
  concept: string | null
  unit_id: string | null
  unit_name: string | null
  amount_untaxed: string
  amount_tax: string
  amount_total: string
  amount_paid: string
  amount_balance: string
  observaciones: string | null
}

interface SaleNoteLine {
  id: string
  sequence: number
  product_id: string | null
  name: string
  qty: string | null
  unit_price_mxn: string
  subtotal: string
  tax_amount: string
  total: string
}

interface ProductLine {
  productId: string | null
  quoteLineId?: string
  name: string
  qty: number   // integer only
  unitPrice: string
}

interface ProductResult {
  id: string
  sku: string | null
  name: string
  description: string | null
  currency: string
  cost_base: string
  utility_fixed: string
  utility_factor: string
  category: string | null
  public_price: string | null
}

interface Unidad { id: string; name: string; ruta_name?: string }

interface QuoteLineCoverage {
  quote_line_id: string
  product_id: string | null
  name: string
  qty_quoted: number
  qty_used: number
  qty_remaining: number
}

interface Props {
  note: SaleNote
  lines: SaleNoteLine[]
  saleId: string
  role: string
  globalDiscount?: number
  quoteLines?: {
    id: string
    product_id: string | null
    name: string
    qty: string | null
    unit_price_mxn_effective: string
    discount_percent: string
  }[]
}

const IVA = 0.16
const inputCls = 'text-right rounded-lg px-2 py-1.5 text-sm font-mono outline-none transition-colors'
const inputStyle = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }
const fmtMXN = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Product search bar (same as cotizaciones ProductSearch) ──────────────────

function NoteProductSearch({ onSelect }: { onSelect: (p: ProductResult) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductResult[]>([])
  const [all, setAll] = useState<ProductResult[]>([])
  const [showCatalog, setShowCatalog] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/products')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setAll)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!query) { setResults([]); return }
    setLoadingSearch(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/products?q=${encodeURIComponent(query)}`)
        if (!r.ok) throw new Error()
        setResults(await r.json())
      } catch { /* ignore */ }
      finally { setLoadingSearch(false) }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowCatalog(false); setResults([]); setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const categories = [...new Set(all.map(p => p.category).filter(Boolean))] as string[]
  const preFiltered = query ? results : showCatalog ? all : []
  const displayed = categoryFilter ? preFiltered.filter(p => p.category === categoryFilter) : preFiltered
  const showDropdown = showCatalog || query.length > 0

  return (
    <div className="relative" ref={ref}>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar producto por nombre o SKU..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setShowCatalog(true)}
          className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
        />
        <button
          type="button"
          onClick={() => setShowCatalog(v => !v)}
          className="px-4 py-2 text-sm rounded-lg transition-all font-medium"
          style={{
            background: showCatalog ? 'var(--c-gold-bg)' : 'transparent',
            color: showCatalog ? 'var(--c-gold)' : 'var(--c-dim)',
            border: '1px solid ' + (showCatalog ? 'var(--c-gold-bd)' : 'var(--c-rim)'),
          }}
        >
          Catálogo
        </button>
      </div>

      {showDropdown && (
        <div
          className="absolute z-20 top-full mt-1.5 w-full rounded-xl max-h-72 overflow-hidden flex flex-col"
          style={{
            background: 'var(--c-card)',
            border: '1px solid var(--c-rim-hi)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
          }}
        >
          <div className="px-3 py-2 flex items-center gap-2 shrink-0" style={{ borderBottom: '1px solid var(--c-rim)' }}>
            <select
              className="appearance-none text-xs font-semibold px-2.5 py-1 rounded-lg outline-none cursor-pointer"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: categoryFilter ? 'var(--c-navy)' : 'var(--c-dim)' }}
            >
              <option value="">Todas las categorías</option>
              {categories.sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {categoryFilter && (
              <button
                type="button"
                onClick={() => setCategoryFilter('')}
                className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-colors"
                style={{ color: 'var(--c-ghost)' }}
              >
                Limpiar
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {loadingSearch ? (
              <div className="px-4 py-3 text-sm" style={{ color: 'var(--c-ghost)' }}>Buscando...</div>
            ) : displayed.length > 0 ? (
              displayed.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onSelect(p); setQuery(''); setShowCatalog(false); setResults([]) }}
                  className="dropdown-item w-full text-left px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid var(--c-rim)' : 'none' }}
                >
                  <p className="text-sm font-medium" style={{ color: 'var(--c-ink)' }}>{p.name}</p>
                  <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--c-ghost)' }}>
                    {p.sku ?? 'Sin SKU'}
                    <span style={{ margin: '0 0.4rem', color: 'var(--c-rim-hi)' }}>·</span>
                    {p.currency}
                    {p.category && (
                      <>
                        <span style={{ margin: '0 0.4rem', color: 'var(--c-rim-hi)' }}>·</span>
                        {p.category}
                      </>
                    )}
                  </p>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm" style={{ color: 'var(--c-ghost)' }}>
                {query ? `Sin resultados para "${query}"` : 'Sin productos en el catálogo'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function NoteDetailView({ note, lines: initialLines, saleId, role, quoteLines = [], globalDiscount = 0 }: Props) {
  const isDraft = note.state === 'draft'
  const canEdit = isDraft && (role === 'sales' || role === 'manager' || role === 'admin')

  // Header state
  const [concept, setConcept] = useState(note.concept ?? '')
  const [observaciones, setObservaciones] = useState(note.observaciones ?? '')
  const [unitId, setUnitId] = useState(note.unit_id ?? '')
  const [unidades, setUnidades] = useState<Unidad[]>([])

  // Lines
  const [lines, setLines] = useState<ProductLine[]>(
    initialLines.map(l => ({
      productId: l.product_id,
      name: l.name,
      qty: Math.max(1, Math.floor(Number(l.qty ?? 1))),
      unitPrice: l.unit_price_mxn,
    }))
  )

  // Quote coverage
  const [coverage, setCoverage] = useState<QuoteLineCoverage[]>([])
  const [coverageLoading, setCoverageLoading] = useState(false)

  // Auto-save state
  const [saving, setSaving] = useState(false)
  const savingCount = useRef(0)

  // Load unidades
  useEffect(() => {
    if (!canEdit) return
    fetch('/api/unidades').then(r => r.json()).then(d => setUnidades(Array.isArray(d) ? d : []))
  }, [canEdit])

  // Load coverage when unit changes
  useEffect(() => {
    if (!canEdit || !unitId || quoteLines.length === 0) { setCoverage([]); return }
    setCoverageLoading(true)
    fetch(`/api/sales/${saleId}/unit-coverage?unit_id=${unitId}`)
      .then(r => r.json())
      .then(d => setCoverage(Array.isArray(d) ? d : []))
      .catch(() => setCoverage([]))
      .finally(() => setCoverageLoading(false))
  }, [canEdit, unitId, saleId, quoteLines.length])

  // ── Header auto-save (per field, on blur) ───────────────────────────────────

  async function saveField(field: 'concept' | 'observaciones' | 'unit_id', value: string) {
    try {
      await fetch(`/api/sales/${saleId}/notes/${note.id}/fields`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value === '' ? null : value }),
      })
    } catch {
      toast('Error al guardar', 'error')
    }
  }

  // ── Lines auto-save (full PUT on any line change) ───────────────────────────

  function computeAmounts(lns: ProductLine[]) {
    const valid = lns.filter(l => l.name && l.qty > 0 && Number(l.unitPrice) > 0)
    if (valid.length === 0) return null
    const untaxed = valid.reduce((s, l) => s + l.qty * Number(l.unitPrice), 0)
    const tax = untaxed * IVA
    return { untaxed, tax, total: untaxed + tax, lines: valid }
  }

  async function saveLinesNow(lns: ProductLine[]) {
    const amounts = computeAmounts(lns)
    if (!amounts) return
    savingCount.current++
    setSaving(true)
    try {
      const apiLines = amounts.lines.map(l => {
        const sub = l.qty * Number(l.unitPrice)
        const taxAmt = sub * IVA
        return {
          product_id: l.productId,
          quote_line_id: l.quoteLineId ?? null,
          name: l.name,
          qty: l.qty,
          unit_price_mxn: Number(l.unitPrice),
          subtotal: sub,
          tax_amount: taxAmt,
          total: sub + taxAmt,
        }
      })
      const res = await fetch(`/api/sales/${saleId}/notes/${note.id}`, {
        method: 'PUT',
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
        toast(d.error ?? 'Error al guardar', 'error')
      }
    } catch {
      toast('Error al guardar', 'error')
    } finally {
      savingCount.current--
      if (savingCount.current === 0) setSaving(false)
    }
  }

  // ── Add product from search bar ─────────────────────────────────────────────

  function addProductFromSearch(product: ProductResult) {
    // Search bar: always use public_price — quote discounts only apply to quote-picker items
    const price = product.public_price
      ? String(parseFloat(product.public_price))
      : String(parseFloat(product.cost_base) * parseFloat(product.utility_factor) + parseFloat(product.utility_fixed))

    const finalName = product.description ? `${product.name} - ${product.description}` : product.name
    const newLines = [...lines, { productId: product.id, name: finalName, qty: 1, unitPrice: price }]
    setLines(newLines)
    saveLinesNow(newLines)
  }

  // ── Remove line ─────────────────────────────────────────────────────────────

  function removeLine(idx: number) {
    const newLines = lines.filter((_, i) => i !== idx)
    setLines(newLines)
    saveLinesNow(newLines)
  }

  // ── Quote picker ────────────────────────────────────────────────────────────

  const gd = 1 - globalDiscount / 100

  const displayLines =
    unitId && coverage.length > 0
      ? coverage.map(c => {
          const ql = quoteLines.find(q => q.id === c.quote_line_id)
          const discount = parseFloat(ql?.discount_percent ?? '0') || 0
          const unitPrice = ql ? parseFloat(ql.unit_price_mxn_effective) * (1 - discount / 100) * gd : 0
          return { id: c.quote_line_id, product_id: c.product_id, name: c.name, maxQty: c.qty_remaining, usedElsewhere: c.qty_used, unitPrice }
        })
      : quoteLines.map(ql => {
          const discount = parseFloat(ql.discount_percent) || 0
          return { id: ql.id, product_id: ql.product_id, name: ql.name, maxQty: Number(ql.qty ?? 1), usedElsewhere: 0, unitPrice: parseFloat(ql.unit_price_mxn_effective) * (1 - discount / 100) * gd }
        })

  const usedQtyByQuoteLine: Record<string, number> = {}
  for (const line of lines) {
    if (line.quoteLineId) usedQtyByQuoteLine[line.quoteLineId] = (usedQtyByQuoteLine[line.quoteLineId] ?? 0) + line.qty
  }

  function addFromQuote(dl: typeof displayLines[number]) {
    const usedNow = usedQtyByQuoteLine[dl.id] ?? 0
    if (dl.maxQty - usedNow <= 0) return
    const existingIdx = lines.findIndex(l => l.quoteLineId === dl.id)
    let newLines: ProductLine[]
    if (existingIdx >= 0) {
      newLines = lines.map((l, i) => i === existingIdx ? { ...l, qty: l.qty + 1 } : l)
    } else {
      const newLine: ProductLine = { productId: dl.product_id, quoteLineId: dl.id, name: dl.name, qty: 1, unitPrice: String(dl.unitPrice) }
      newLines = [...lines, newLine]
    }
    setLines(newLines)
    saveLinesNow(newLines)
  }

  // ── Computed totals ─────────────────────────────────────────────────────────

  const amounts = computeAmounts(lines)
  const hasQuotePicker = quoteLines.length > 0 && canEdit

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* ── Header metadata card ── */}
      <div className="rounded-xl p-4" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Unidad</label>
            {canEdit ? (
              <select
                value={unitId}
                onChange={e => setUnitId(e.target.value)}
                onBlur={e => saveField('unit_id', e.target.value)}
                className="text-sm rounded-lg px-3 py-2.5 outline-none"
                style={inputStyle}
              >
                <option value="">Sin unidad</option>
                {unidades.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name}{u.ruta_name ? ` — ${u.ruta_name}` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm px-3 py-2.5 rounded-lg" style={{ color: note.unit_name ? 'var(--c-ink)' : 'var(--c-ghost)' }}>
                {note.unit_name ?? 'Sin unidad'}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Concepto</label>
            {canEdit ? (
              <input
                type="text"
                value={concept}
                onChange={e => setConcept(e.target.value)}
                onBlur={e => saveField('concept', e.target.value)}
                className="text-sm rounded-lg px-3 py-2.5 outline-none"
                style={inputStyle}
                placeholder="Ej: Anticipo, Segunda entrega, Saldo final..."
              />
            ) : (
              <div className="text-sm px-3 py-2.5" style={{ color: note.concept ? 'var(--c-ink)' : 'var(--c-ghost)' }}>
                {note.concept ?? '—'}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-4">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Observaciones</label>
            {canEdit ? (
              <textarea
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                onBlur={e => saveField('observaciones', e.target.value)}
                rows={2}
                className="text-sm rounded-lg px-3 py-2.5 resize-none outline-none"
                style={inputStyle}
                placeholder="Notas internas sobre esta nota..."
              />
            ) : (
              <div className="text-sm px-3 py-2.5 rounded-lg" style={{ color: note.observaciones ? 'var(--c-ink)' : 'var(--c-ghost)', minHeight: '56px' }}>
                {note.observaciones ?? '—'}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Lines area ── */}
      <div className="grid gap-5" style={{ gridTemplateColumns: hasQuotePicker ? '300px 1fr' : '1fr' }}>

        {/* Quote products picker (left column) */}
        {hasQuotePicker && (
          <div className="rounded-2xl flex flex-col overflow-hidden" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
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
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    style={{ borderBottom: '1px solid var(--c-rim)', opacity: exhausted ? 0.4 : 1, cursor: exhausted ? 'default' : 'pointer' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight truncate" style={{ color: 'var(--c-ink)' }}>{dl.name}</p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--c-ghost)' }}>
                        ×{dl.maxQty.toLocaleString('es-MX')} · ${dl.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        {unitId && dl.usedElsewhere > 0 && (
                          <span style={{ color: 'var(--c-dim)', marginLeft: 6 }}>({dl.usedElsewhere} en otras)</span>
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

        {/* Right: search bar + table */}
        <div className="flex flex-col gap-3">

          {canEdit && (
            <>
              {/* Product search bar */}
              <div className={saving ? 'opacity-60 pointer-events-none transition-opacity' : 'transition-opacity'}>
                <NoteProductSearch onSelect={addProductFromSearch} />
              </div>

              {/* Saving indicator */}
              {saving && (
                <span className="text-xs" style={{ color: 'var(--c-ghost)' }}>Guardando...</span>
              )}
            </>
          )}

          {/* Lines table */}
          {(lines.length > 0 || !canEdit) && (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
              {lines.length === 0 && canEdit ? null : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[480px]">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                          <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Descripción</th>
                          <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-20" style={{ color: 'var(--c-ghost)' }}>Cant.</th>
                          <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-28" style={{ color: 'var(--c-ghost)' }}>Precio Unit.</th>
                          <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-28" style={{ color: 'var(--c-ghost)' }}>Subtotal</th>
                          {canEdit && <th className="w-10 px-2 py-3.5" />}
                        </tr>
                      </thead>
                      <tbody>
                        {canEdit
                          ? lines.map((line, idx) => (
                              <tr key={idx} className="tr-hover transition-colors" style={{ borderTop: '1px solid var(--c-rim)' }}>
                                {/* Description — read-only */}
                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--c-ink)' }}>
                                  {line.name}
                                </td>
                                {/* Cant. — integer */}
                                <td className="px-4 py-3 text-right">
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    defaultValue={line.qty}
                                    key={`qty-${idx}-${line.qty}`}
                                    className={`w-16 ${inputCls}`}
                                    style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'var(--c-navy)')}
                                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                                    onBlur={e => {
                                      e.target.style.borderColor = 'var(--c-rim)'
                                      const v = Math.max(1, Math.floor(Number(e.target.value) || 1))
                                      e.target.value = String(v)
                                      if (v !== line.qty) {
                                        const newLines = lines.map((l, i) => i === idx ? { ...l, qty: v } : l)
                                        setLines(newLines)
                                        saveLinesNow(newLines)
                                      }
                                    }}
                                  />
                                </td>
                                {/* Precio Unit. */}
                                <td className="px-4 py-3 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    defaultValue={Number(line.unitPrice).toFixed(2)}
                                    key={`price-${idx}-${line.unitPrice}`}
                                    className={`w-24 ${inputCls}`}
                                    style={inputStyle}
                                    onFocus={e => (e.target.style.borderColor = 'var(--c-navy)')}
                                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                                    onBlur={e => {
                                      e.target.style.borderColor = 'var(--c-rim)'
                                      const v = Number(e.target.value)
                                      if (v >= 0 && String(v) !== line.unitPrice) {
                                        const newLines = lines.map((l, i) => i === idx ? { ...l, unitPrice: String(v) } : l)
                                        setLines(newLines)
                                        saveLinesNow(newLines)
                                      }
                                    }}
                                  />
                                </td>
                                {/* Subtotal */}
                                <td className="px-4 py-3 text-right font-mono font-medium" style={{ color: 'var(--c-ink)' }}>
                                  {line.qty > 0 && Number(line.unitPrice) > 0
                                    ? `$${fmtMXN(line.qty * Number(line.unitPrice))}`
                                    : <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                                </td>
                                {/* Delete */}
                                <td className="px-2 py-3 text-right">
                                  <button
                                    type="button"
                                    aria-label="Eliminar línea"
                                    onClick={() => removeLine(idx)}
                                    className="btn-delete text-xs"
                                  >✕</button>
                                </td>
                              </tr>
                            ))
                          : initialLines.map(line => (
                              <tr key={line.id} style={{ borderTop: '1px solid var(--c-rim)' }}>
                                <td className="px-4 py-3" style={{ color: 'var(--c-ink)' }}>{line.name}</td>
                                <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--c-dim)' }}>{Math.floor(Number(line.qty ?? 1))}</td>
                                <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--c-dim)' }}>
                                  ${Number(line.unit_price_mxn).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-medium" style={{ color: 'var(--c-ink)' }}>
                                  ${Number(line.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            ))
                        }
                      </tbody>
                    </table>
                  </div>

                  {/* Totals footer */}
                  <div className="px-5 py-4 flex justify-end" style={{ borderTop: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}>
                    <div className="flex flex-col items-end gap-1 text-sm">
                      <div className="flex gap-8">
                        <span style={{ color: 'var(--c-ghost)' }}>Subtotal</span>
                        <span className="font-mono" style={{ color: 'var(--c-ink)', minWidth: '7rem', textAlign: 'right' }}>
                          {canEdit
                            ? `$${amounts ? fmtMXN(amounts.untaxed) : '0.00'}`
                            : `$${Number(note.amount_untaxed).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                      <div className="flex gap-8">
                        <span style={{ color: 'var(--c-ghost)' }}>IVA (16%)</span>
                        <span className="font-mono" style={{ color: 'var(--c-ink)', minWidth: '7rem', textAlign: 'right' }}>
                          {canEdit
                            ? `$${amounts ? fmtMXN(amounts.tax) : '0.00'}`
                            : `$${Number(note.amount_tax).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                      <div className="flex gap-8 pt-1" style={{ borderTop: '1px solid var(--c-rim)' }}>
                        <span className="font-semibold" style={{ color: 'var(--c-ink)' }}>Total</span>
                        <span className="font-mono font-bold text-base" style={{ color: 'var(--c-ink)', minWidth: '7rem', textAlign: 'right' }}>
                          {canEdit
                            ? `$${amounts ? fmtMXN(amounts.total) : '0.00'}`
                            : `$${Number(note.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                      {!isDraft && (
                        <>
                          <div className="flex gap-8">
                            <span style={{ color: 'var(--c-ghost)' }}>Pagado</span>
                            <span className="font-mono" style={{ color: '#15803D', minWidth: '7rem', textAlign: 'right' }}>
                              ${Number(note.amount_paid).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex gap-8">
                            <span className="font-semibold" style={{ color: 'var(--c-ghost)' }}>Saldo</span>
                            <span className="font-mono font-semibold" style={{ color: Number(note.amount_balance) > 0 ? '#B45309' : '#15803D', minWidth: '7rem', textAlign: 'right' }}>
                              ${Number(note.amount_balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Empty state */}
          {canEdit && lines.length === 0 && (
            <div
              className="rounded-2xl py-14 text-center"
              style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--c-dim)' }}>Sin líneas</p>
              <p className="text-xs mt-1" style={{ color: 'var(--c-ghost)' }}>Busca un producto en la barra de arriba.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
