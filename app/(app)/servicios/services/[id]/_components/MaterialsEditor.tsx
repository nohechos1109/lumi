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

const inputStyle = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }

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

  async function removeQuoteLineMaterials(quoteLineId: string) {
    const linked = materials.filter(m => m.quote_line_id === quoteLineId)
    if (linked.length === 0) return
    await Promise.all(linked.map(m =>
      fetch(`/api/servicios/services/${serviceId}/materials?material_id=${m.id}`, { method: 'DELETE' })
    ))
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
    // If product matches a pending quote line, link it
    const matchingLine = displayLines.find(dl => dl.product_id === product.id && (dl.maxQty - (usedByQuoteLine[dl.id] ?? 0)) > 0)
    addMaterial(product.id, priceMxn, matchingLine?.id ?? null)
  }

  const [quoteOpen, setQuoteOpen] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<{ quoteLineId: string; name: string } | null>(null)
  const [deleteMaterialConfirm, setDeleteMaterialConfirm] = useState<{ id: string; name: string } | null>(null)

  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--c-ghost)' }}>
        Materiales utilizados
      </h2>

      <div className="flex flex-col gap-3">
        {canEdit && <ProductSearch onSelect={addFromSearch} />}

        {/* ── Collapsible quote products table ── */}
        {hasQuotePicker && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
            <button
              type="button"
              onClick={() => setQuoteOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
              style={{ background: 'var(--c-panel)', borderBottom: quoteOpen ? '1px solid var(--c-rim)' : 'none', cursor: 'pointer' }}
            >
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
                Productos de la cotización
                {unidadId && <span className="ml-1 normal-case font-normal tracking-normal"> (pendientes para esta unidad)</span>}
              </span>
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ color: 'var(--c-ghost)', flexShrink: 0, transition: 'transform 0.15s', transform: quoteOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {quoteOpen && (
              <table className="w-full text-sm">
                <tbody>
                  {coverageLoading && (
                    <tr><td colSpan={3} className="px-4 py-3 text-xs" style={{ color: 'var(--c-ghost)' }}>Cargando...</td></tr>
                  )}
                  {!coverageLoading && displayLines.map(dl => {
                    const usedNow = usedByQuoteLine[dl.id] ?? 0
                    const remaining = dl.maxQty - usedNow
                    const exhausted = remaining <= 0
                    const isAdding = adding === dl.id
                    return (
                      <tr key={dl.id} style={{ borderTop: '1px solid var(--c-rim)', opacity: exhausted ? 0.45 : 1 }}>
                        <td className="px-4 py-3" style={{ color: 'var(--c-ink)' }}>
                          <span className="text-sm font-medium">{dl.name}</span>
                          {unidadId && dl.usedElsewhere > 0 && (
                            <span className="ml-2 text-xs font-mono" style={{ color: 'var(--c-dim)' }}>({dl.usedElsewhere} agregado{dl.usedElsewhere !== 1 ? 's' : ''} en otras)</span>
                          )}
                          {usedNow > 0 && !exhausted && (
                            <span className="ml-2 text-xs font-mono" style={{ color: 'var(--c-navy)' }}>({usedNow} en servicio)</span>
                          )}
                          {exhausted && <span className="ml-2 text-xs font-mono" style={{ color: 'var(--c-ghost)' }}>completo</span>}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs font-mono" style={{ color: 'var(--c-ghost)' }}>×{dl.maxQty.toLocaleString('es-MX')}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {usedNow > 0 && canEdit && (
                              <button
                                type="button"
                                onClick={() => setRemoveConfirm({ quoteLineId: dl.id, name: dl.name })}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors btn-delete"
                                title="Retirar todos los agregados"
                              >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                  <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                              </button>
                            )}
                            {exhausted ? (
                              <span className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'var(--c-ghost)' }}>
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <path d="M2 7l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </span>
                            ) : canEdit ? (
                              <button
                                type="button"
                                disabled={isAdding}
                                onClick={() => !isAdding && addFromQuote(dl)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                style={{ background: isAdding ? 'var(--c-rim-hi)' : 'var(--c-navy)', color: '#fff', border: 'none', cursor: isAdding ? 'default' : 'pointer' }}
                              >
                                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                                  <rect x="6" width="2" height="14" rx="1" fill="currentColor"/>
                                  <rect y="6" width="14" height="2" rx="1" fill="currentColor"/>
                                </svg>
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {materials.length === 0 ? (
          <div className="rounded-2xl py-14 text-center" style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--c-dim)' }}>Sin materiales registrados.</p>
            {canEdit && <p className="text-xs mt-1" style={{ color: 'var(--c-ghost)' }}>Busca un producto arriba para agregar.</p>}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[320px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                    <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Descripción</th>
                    <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Cantidad</th>
                    <th className="w-14 px-2 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {materials.map(m => (
                    <tr key={m.id} className="tr-hover transition-colors" style={{ borderTop: '1px solid var(--c-rim)' }}>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--c-ink)' }}>
                        {m.product_name}
                        {m.product_sku && (
                          <span className="ml-2 text-xs font-mono" style={{ color: 'var(--c-ghost)' }}>{m.product_sku}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                const next = Math.round(Number(m.quantity)) - 1
                                if (next <= 0) deleteMaterial(m.id)
                                else patchMaterial(m.id, 'quantity', next)
                              }}
                              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', cursor: 'pointer' }}
                            >
                              <svg width="14" height="2" viewBox="0 0 14 2" fill="none"><rect width="14" height="2" rx="1" fill="currentColor"/></svg>
                            </button>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              defaultValue={Math.round(Number(m.quantity))}
                              key={`qty-${m.id}-${m.quantity}`}
                              className="font-mono text-sm text-center rounded-md px-1 py-1 outline-none w-12"
                              style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
                              onFocus={e => { e.target.style.borderColor = 'var(--c-navy)'; e.target.select() }}
                              onKeyDown={e => {
                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                                if (['.', ',', 'e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
                              }}
                              onBlur={e => {
                                e.target.style.borderColor = 'var(--c-rim)'
                                const v = Math.round(Math.abs(Number(e.target.value))) || 0
                                if (v <= 0) { deleteMaterial(m.id); return }
                                e.target.value = String(v)
                                if (v !== Math.round(Number(m.quantity))) patchMaterial(m.id, 'quantity', v)
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => patchMaterial(m.id, 'quantity', Math.round(Number(m.quantity)) + 1)}
                              className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                              style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', cursor: 'pointer' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="6" width="2" height="14" rx="1" fill="currentColor"/><rect y="6" width="14" height="2" rx="1" fill="currentColor"/></svg>
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono float-right" style={{ color: 'var(--c-ink)' }}>{Math.round(Number(m.quantity))}</span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-right">
                        {canEdit && (
                          <button
                            type="button"
                            aria-label="Eliminar material"
                            onClick={() => setDeleteMaterialConfirm({ id: m.id, name: m.product_name ?? '' })}
                            className="btn-delete text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Delete material confirmation modal ── */}
      {deleteMaterialConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setDeleteMaterialConfirm(null)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim-hi)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>Eliminar material</p>
              <p className="text-sm mt-1.5" style={{ color: 'var(--c-dim)' }}>
                Se eliminará <strong>{deleteMaterialConfirm.name}</strong> de los materiales utilizados.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setDeleteMaterialConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteMaterialConfirm.id
                  setDeleteMaterialConfirm(null)
                  await deleteMaterial(id)
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--c-danger, #e53e3e)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove confirmation modal ── */}
      {removeConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setRemoveConfirm(null)}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim-hi)', boxShadow: '0 24px 48px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>
                Retirar materiales de cotización
              </p>
              <p className="text-sm mt-1.5" style={{ color: 'var(--c-dim)' }}>
                Se eliminarán todos los materiales agregados para <strong>{removeConfirm.name}</strong>. Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setRemoveConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = removeConfirm.quoteLineId
                  setRemoveConfirm(null)
                  await removeQuoteLineMaterials(id)
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'var(--c-danger, #e53e3e)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Retirar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
