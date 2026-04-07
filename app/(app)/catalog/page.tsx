'use client'
import { useState, useEffect, useMemo } from 'react'
import { toast } from '@/lib/toast'

interface CatalogProduct {
  id: string
  sku: string | null
  name: string
  description: string | null
  category: string | null
  currency: string
  image_url: string | null
  codigo_sat: string | null
  price_without_tax: number
  price_with_tax: number
}

function formatMXN(amount: number): string {
  return amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <div
      style={{
        background: 'var(--c-card)',
        border: '1px solid var(--c-rim)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Image area */}
      {product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image_url}
          alt={product.name}
          style={{ width: '100%', height: '160px', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '160px',
            background: 'var(--c-panel)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-ghost)" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        {/* Category badge */}
        {product.category && (
          <span
            style={{
              background: 'var(--c-panel)',
              color: 'var(--c-ghost)',
              fontSize: '11px',
              borderRadius: '6px',
              padding: '2px 6px',
              alignSelf: 'flex-start',
              fontWeight: 500,
            }}
          >
            {product.category}
          </span>
        )}

        {/* Name */}
        <p
          style={{
            color: 'var(--c-ink)',
            fontWeight: 700,
            fontSize: '14px',
            lineHeight: '1.35',
            margin: 0,
          }}
        >
          {product.name}
        </p>

        {/* SKU */}
        {product.sku && (
          <p style={{ color: 'var(--c-ghost)', fontSize: '11px', margin: 0 }}>
            SKU: {product.sku}
          </p>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Prices */}
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <p style={{ color: 'var(--c-dim)', fontSize: '12px', margin: 0 }}>
            $ {formatMXN(product.price_without_tax)} MXN
          </p>
          <p
            style={{
              color: 'var(--c-navy)',
              fontWeight: 600,
              fontFamily: 'monospace',
              fontSize: '14px',
              margin: 0,
            }}
          >
            $ {formatMXN(product.price_with_tax)} MXN{' '}
            <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--c-ghost)' }}>(c/IVA)</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function CatalogPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [currencyFilter, setCurrencyFilter] = useState('all')

  useEffect(() => {
    fetch('/api/products/catalog')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setProducts)
      .catch(() => toast('Error al cargar el catálogo', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(() =>
    Array.from(new Set(products.map(p => p.category).filter(Boolean) as string[])).sort(),
  [products])

  const filtered = useMemo(() => products.filter(p => {
    const q = search.toLowerCase()
    const matchSearch = !q
      || p.name.toLowerCase().includes(q)
      || (p.sku ?? '').toLowerCase().includes(q)
      || (p.category ?? '').toLowerCase().includes(q)
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter
    const matchCur = currencyFilter === 'all' || p.currency === currencyFilter
    return matchSearch && matchCat && matchCur
  }), [products, search, categoryFilter, currencyFilter])

  if (loading) {
    return (
      <div className="py-16 text-center text-sm" style={{ color: 'var(--c-ghost)' }}>
        Cargando catálogo...
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6" style={{ color: 'var(--c-ink)' }}>
        Catálogo de Productos
      </h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Buscar por nombre, SKU o categoría…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '8px',
          border: '1px solid var(--c-rim)',
          background: 'var(--c-panel)',
          color: 'var(--c-ink)',
          fontSize: '14px',
          marginBottom: '16px',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', ...categories] as string[]).map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              border: categoryFilter === cat ? 'none' : '1px solid var(--c-rim)',
              background: categoryFilter === cat ? 'var(--c-navy)' : 'var(--c-panel)',
              color: categoryFilter === cat ? 'white' : 'var(--c-dim)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {cat === 'all' ? 'Todos' : cat}
          </button>
        ))}
      </div>

      {/* Currency filter */}
      <div className="flex gap-2 mb-6">
        {(['all', 'MXN', 'USD'] as const).map(cur => (
          <button
            key={cur}
            onClick={() => setCurrencyFilter(cur)}
            style={{
              padding: '5px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              border: currencyFilter === cur ? 'none' : '1px solid var(--c-rim)',
              background: currencyFilter === cur ? 'var(--c-navy)' : 'var(--c-panel)',
              color: currencyFilter === cur ? 'white' : 'var(--c-dim)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {cur === 'all' ? 'Todos' : cur}
          </button>
        ))}
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center text-sm" style={{ color: 'var(--c-ghost)' }}>
          No se encontraron productos
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
