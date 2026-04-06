'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from '@/lib/toast'

interface Product {
  id: string; sku: string | null; name: string; description: string | null; currency: string
  cost_base: string; utility_fixed: string; utility_factor: string; category: string | null
}

interface Props {
  onSelect: (product: Product) => void
}

export default function ProductSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [all, setAll] = useState<Product[]>([])
  const [showCatalog, setShowCatalog] = useState(false)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Block A: error handling on initial load
  useEffect(() => {
    fetch('/api/products')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setAll)
      .catch(() => toast('Error al cargar el catálogo', 'error'))
  }, [])

  // Block A: error handling + loading on search
  useEffect(() => {
    if (!query) { setResults([]); return }
    setLoadingSearch(true)
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/products?q=${encodeURIComponent(query)}`)
        if (!r.ok) throw new Error()
        setResults(await r.json())
      } catch {
        toast('Error al buscar productos', 'error')
      } finally {
        setLoadingSearch(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowCatalog(false)
        setResults([])
        setQuery('')
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
          className="flex-1"
          style={{ background: 'var(--c-panel)' }}
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

      {/* Block C: show dropdown with content or empty state */}
      {showDropdown && (
        <div
          className="absolute z-20 top-full mt-1.5 w-full rounded-xl max-h-72 overflow-hidden flex flex-col"
          style={{
            background: 'var(--c-card)',
            border: '1px solid var(--c-rim-hi)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.18)',
          }}
        >
          {/* Category filter inside dropdown */}
          <div className="px-3 py-2 flex items-center gap-2 shrink-0" style={{ borderBottom: '1px solid var(--c-rim)' }}>
            <select
              className="appearance-none text-xs font-semibold px-2.5 py-1 rounded-lg outline-none cursor-pointer"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
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
            <div className="px-4 py-3 text-sm" style={{ color: 'var(--c-ghost)' }}>
              Buscando...
            </div>
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
            /* Block C: empty state */
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
