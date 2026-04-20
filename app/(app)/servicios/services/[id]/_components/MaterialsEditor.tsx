'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import type { ServiceMaterial } from '@/lib/queries/servicios'
import type { QuoteLine } from '@/lib/queries/quote_lines'

interface QuoteLineCoverage {
  quote_line_id: string
  product_id: string | null
  name: string
  qty_quoted: number
  qty_used: number
  qty_remaining: number
}

interface Product {
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

interface Props {
  serviceId: string
  materials: ServiceMaterial[]
  canEdit: boolean
  saleId?: string | null
  saleQuoteLines?: QuoteLine[]
  globalDiscount?: number
  fxRate?: number
  unidadId?: string | null
}

const IVA = 0.16
const inputCls = 'text-right rounded-lg px-2 py-1.5 text-sm font-mono outline-none transition-colors'
const inputStyle = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }
const fmtMXN = (n: number) => n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmt = (v: string | number) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })

// ── Product search bar ──────────────────────────────────────────────────────

function ProductSearch({ onSelect }: { onSelect: (p: Product) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [all, setAll] = useState<Product[]>([])
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
          className="flex-1 rounded-lg px-4 py-2.5 text-sm"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => setShowCatalog(v => !v)}
          className="px-4 py-2 text-sm rounded-lg transition-all font-medium"
          style={{
            background: showCatalog ? 'var(--c-gold-bg)' : 'transparent',
            color: showCatalog ? 'var(--c-gold)' : 'var(--c-dim)',
            border: '1px solid ' + (showCatalog ? 'var(--c-gold-bd)' : 'var(--c-rim)'),
            cursor: 'pointer',
          }}
        >
          Catálogo
        </button>
      </div>
      {showDropdown && (
        <div
          className="absolute z-20 top-full mt-1.5 w-full rounded-xl max-h-72 overflow-hidden flex flex-col"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim-hi)', boxShadow: '0 16px 40px rgba(0,0,0,0.18)' }}
        >
          <div className="px-3 py-2 flex items-center gap-2 shrink-0" style={{ borderBottom: '1px solid var(--c-rim)' }}>
            <select
              className="appearance-none text-xs font-semibold px-2.5 py-1 rounded-lg outline-none cursor-pointer"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: categoryFilter ? 'var(--c-navy)' : 'var(--c-dim)' }}
            >
              <option value="">Todas las categorías</option>
              {categories.sort().map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {categoryFilter && (
              <button type="button" onClick={() => setCategoryFilter('')} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: 'var(--c-ghost)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
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
                    {p.category && <><span style={{ margin: '0 0.4rem', color: 'var(--c-rim-hi)' }}>·</span>{p.category}</>}
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

// ── Main component ──────────────────────────────────────────────────────────

export default function MaterialsEditor({
  serviceId,
  materials,
  canEdit,
  saleId,
  saleQuoteLines = [],
  globalDiscount = 0,
  fxRate = 17.85,
  unidadId,
}: Props) {
  const router = useRouter()
  const [coverage, setCoverage] = useState<QuoteLineCoverage[]>([])
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)

  const hasQuotePicker = saleQuoteLines.length > 0

  useEffect(() => {
    if (!unidadId || !saleId || saleQuoteLines.length === 0) { setCoverage([]); return }
    setCoverageLoading(true)
    fetch(`/api/sales/${saleId}/unit-coverage?unit_id=${unidadId}`)
      .then(r => r.json())
      .then(d => setCoverage(Array.isArray(d) ? d : []))
      .catch(() => setCoverage([]))
      .finally(() => setCoverageLoading(false))
  }, [unidadId, saleId, saleQuoteLines.length])

  const gd = 1 - globalDiscount / 100

  const displayLines = useMemo(() => {
    if (unidadId && coverage.length > 0) {
      return coverage.map(c => {
        const ql = saleQuoteLines.find(q => q.id === c.quote_line_id)
        const discount = parseFloat(ql?.discount_percent ?? '0') || 0
        const unitPrice = ql ? parseFloat(ql.unit_price_mxn_effective) * (1 - discount / 100) * gd : 0
        return { id: c.quote_line_id, product_id: c.product_id, name: c.name, maxQty: c.qty_remaining, usedElsewhere: c.qty_used, unitPrice }
      })
    }
    return saleQuoteLines.map(ql => {
      const discount = parseFloat(ql.discount_percent) || 0
      return { id: ql.id, product_id: ql.product_id, name: ql.name, maxQty: Number(ql.qty ?? 1), usedElsewhere: 0, unitPrice: parseFloat(ql.unit_price_mxn_effective) * (1 - discount / 100) * gd }
    })
  }, [saleQuoteLines, coverage, unidadId, gd])

  const usedByQuoteLine = useMemo(() => {
    const map: Record<string, number> = {}
    for (const m of materials) {
      if (m.quote_line_id) map[m.quote_line_id] = (map[m.quote_line_id] ?? 0) + Number(m.quantity)
    }
    return map
  }, [materials])

  async function addMaterial(productId: string, unitPrice: number, quoteLineId?: string | null) {
    const key = quoteLineId ?? productId
    setAdding(key)
    try {
      const res = await fetch(`/api/servicios/services/${serviceId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          quantity: 1,
          unit_price: unitPrice,
          quote_line_id: quoteLineId ?? null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast(err.error || 'Error al agregar material', 'error')
        return
      }
      router.refresh()
    } finally {
      setAdding(null)
    }
  }

  async function patchMaterial(materialId: string, field: 'quantity' | 'unit_price', value: number) {
    const res = await fetch(`/api/servicios/services/${serviceId}/materials`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_id: materialId, [field]: value }),
    })
    if (!res.ok) { toast('Error al actualizar', 'error'); return }
    router.refresh()
  }

  async function deleteMaterial(materialId: string) {
    const res = await fetch(`/api/servicios/services/${serviceId}/materials?material_id=${materialId}`, { method: 'DELETE' })
    if (!res.ok) { toast('Error al eliminar material', 'error'); return }
    router.refresh()
  }

  function addFromQuote(dl: typeof displayLines[number]) {
    const usedNow = usedByQuoteLine[dl.id] ?? 0
    if (dl.maxQty - usedNow <= 0) return
    addMaterial(dl.product_id ?? '', dl.unitPrice, dl.id)
  }

  function addFromSearch(product: Product) {
    const rawPrice = product.public_price
      ? parseFloat(product.public_price)
      : parseFloat(product.cost_base) * parseFloat(product.utility_factor) + parseFloat(product.utility_fixed)
    const priceMxn = product.currency === 'USD' ? rawPrice * fxRate : rawPrice
    addMaterial(product.id, priceMxn, null)
  }

  const untaxed = materials.reduce((s, m) => s + Number(m.quantity) * Number(m.unit_price), 0)
  const tax = untaxed * IVA
  const total = untaxed + tax

  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--c-ghost)' }}>
        Materiales utilizados
      </h2>

      <div className="grid gap-5" style={{ gridTemplateColumns: hasQuotePicker ? '300px 1fr' : '1fr' }}>

        {/* Quote products picker (left column) */}
        {hasQuotePicker && (
          <div className="rounded-2xl flex flex-col overflow-hidden" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
                Productos de la cotización
                {unidadId && <span className="ml-1 normal-case font-normal">(pendientes para esta unidad)</span>}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {coverageLoading && (
                <p className="px-4 py-3 text-xs" style={{ color: 'var(--c-ghost)' }}>Cargando...</p>
              )}
              {!coverageLoading && displayLines.map(dl => {
                const usedNow = usedByQuoteLine[dl.id] ?? 0
                const remaining = dl.maxQty - usedNow
                const exhausted = remaining <= 0
                const isAdding = adding === dl.id
                return (
                  <button
                    key={dl.id}
                    type="button"
                    onClick={() => !exhausted && !isAdding && canEdit && addFromQuote(dl)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left"
                    style={{ borderBottom: '1px solid var(--c-rim)', opacity: exhausted ? 0.4 : 1, cursor: !canEdit || exhausted || isAdding ? 'default' : 'pointer' }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight truncate" style={{ color: 'var(--c-ink)' }}>{dl.name}</p>
                      <p className="text-xs mt-0.5 font-mono" style={{ color: 'var(--c-ghost)' }}>
                        ×{dl.maxQty.toLocaleString('es-MX')} · ${dl.unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        {unidadId && dl.usedElsewhere > 0 && (
                          <span style={{ color: 'var(--c-dim)', marginLeft: 6 }}>({dl.usedElsewhere} en otras)</span>
                        )}
                        {usedNow > 0 && !exhausted && (
                          <span style={{ color: 'var(--c-navy)', marginLeft: 6 }}>({usedNow} en servicio)</span>
                        )}
                        {exhausted && <span style={{ marginLeft: 6 }}>completo</span>}
                      </p>
                    </div>
                    <span
                      className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-sm font-bold"
                      style={{ background: exhausted ? 'var(--c-rim)' : isAdding ? 'var(--c-rim-hi)' : 'var(--c-navy)', color: exhausted ? 'var(--c-ghost)' : '#fff' }}
                    >
                      {exhausted ? '✓' : '+'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Right: search + table */}
        <div className="flex flex-col gap-3">

          {canEdit && <ProductSearch onSelect={addFromSearch} />}

          {materials.length === 0 ? (
            <div className="rounded-2xl py-14 text-center" style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}>
              <p className="text-sm font-semibold" style={{ color: 'var(--c-dim)' }}>Sin materiales registrados.</p>
              {canEdit && <p className="text-xs mt-1" style={{ color: 'var(--c-ghost)' }}>Busca un producto arriba para agregar.</p>}
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                      <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Descripción</th>
                      <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-20" style={{ color: 'var(--c-ghost)' }}>Cant.</th>
                      <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-28" style={{ color: 'var(--c-ghost)' }}>P. Unit.</th>
                      <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-28" style={{ color: 'var(--c-ghost)' }}>Subtotal</th>
                      {canEdit && <th className="w-10 px-2 py-3.5" />}
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map(m => {
                      const sub = Number(m.quantity) * Number(m.unit_price)
                      return (
                        <tr key={m.id} className="tr-hover transition-colors" style={{ borderTop: '1px solid var(--c-rim)' }}>
                          <td className="px-4 py-3 text-sm" style={{ color: 'var(--c-ink)' }}>
                            {m.product_name}
                            {m.product_sku && (
                              <span className="ml-2 text-xs font-mono" style={{ color: 'var(--c-ghost)' }}>{m.product_sku}</span>
                            )}
                          </td>
                          {/* Cant. */}
                          <td className="px-4 py-3 text-right">
                            {canEdit ? (
                              <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                defaultValue={Number(m.quantity).toFixed(2)}
                                key={`qty-${m.id}-${m.quantity}`}
                                className={`w-16 ${inputCls}`}
                                style={inputStyle}
                                onFocus={e => (e.target.style.borderColor = 'var(--c-navy)')}
                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                                onBlur={e => {
                                  e.target.style.borderColor = 'var(--c-rim)'
                                  const v = Math.max(0.01, Number(e.target.value) || 0.01)
                                  e.target.value = String(v)
                                  if (v !== Number(m.quantity)) patchMaterial(m.id, 'quantity', v)
                                }}
                              />
                            ) : (
                              <span className="font-mono" style={{ color: 'var(--c-ink)' }}>{fmt(m.quantity)}</span>
                            )}
                          </td>
                          {/* P. Unit. */}
                          <td className="px-4 py-3 text-right">
                            {canEdit ? (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                defaultValue={Number(m.unit_price).toFixed(2)}
                                key={`price-${m.id}-${m.unit_price}`}
                                className={`w-24 ${inputCls}`}
                                style={inputStyle}
                                onFocus={e => (e.target.style.borderColor = 'var(--c-navy)')}
                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                                onBlur={e => {
                                  e.target.style.borderColor = 'var(--c-rim)'
                                  const v = Math.max(0, Number(e.target.value))
                                  if (v !== Number(m.unit_price)) patchMaterial(m.id, 'unit_price', v)
                                }}
                              />
                            ) : (
                              <span className="font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(m.unit_price)}</span>
                            )}
                          </td>
                          {/* Subtotal */}
                          <td className="px-4 py-3 text-right font-mono font-medium" style={{ color: 'var(--c-ink)' }}>
                            {sub > 0 ? `$${fmtMXN(sub)}` : <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                          </td>
                          {canEdit && (
                            <td className="px-2 py-3 text-right">
                              <button
                                type="button"
                                aria-label="Eliminar material"
                                onClick={() => deleteMaterial(m.id)}
                                className="btn-delete text-xs"
                              >
                                ✕
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals footer */}
              <div className="px-5 py-4 flex justify-end" style={{ borderTop: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}>
                <div className="flex flex-col items-end gap-1 text-sm">
                  <div className="flex gap-8">
                    <span style={{ color: 'var(--c-ghost)' }}>Subtotal</span>
                    <span className="font-mono" style={{ color: 'var(--c-ink)', minWidth: '7rem', textAlign: 'right' }}>${fmtMXN(untaxed)}</span>
                  </div>
                  <div className="flex gap-8">
                    <span style={{ color: 'var(--c-ghost)' }}>IVA (16%)</span>
                    <span className="font-mono" style={{ color: 'var(--c-ink)', minWidth: '7rem', textAlign: 'right' }}>${fmtMXN(tax)}</span>
                  </div>
                  <div className="flex gap-8 pt-1" style={{ borderTop: '1px solid var(--c-rim)' }}>
                    <span className="font-semibold" style={{ color: 'var(--c-ink)' }}>Total</span>
                    <span className="font-mono font-bold text-base" style={{ color: 'var(--c-ink)', minWidth: '7rem', textAlign: 'right' }}>${fmtMXN(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
