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

// ── Category placeholder config ───────────────────────────────────────────────

interface CategoryMeta { bg: string; accent: string; icon: React.ReactNode }

function getCategoryMeta(category: string | null): CategoryMeta {
  const s = (category ?? '').toLowerCase()

  // Cámaras — lente de cámara, universalmente reconocida
  if (s.includes('camara') || s.includes('cámara'))
    return {
      bg: '#EFF6FF', accent: '#1C5AD6',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>,
    }

  // Grabadores — disco duro / NVR box
  if (s.includes('grabador'))
    return {
      bg: '#FFF7ED', accent: '#EA580C',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2"/>
        <path d="M6 6h.01M6 18h.01"/>
      </svg>,
    }

  // Pantallas — monitor/TV
  if (s.includes('pantalla'))
    return {
      bg: '#F5F3FF', accent: '#7C3AED',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2"/>
        <path d="M8 21h8M12 17v4"/>
      </svg>,
    }

  // Alarma — campana con ondas (sirena inalámbrica)
  if (s.includes('alarma'))
    return {
      bg: '#FFF1F2', accent: '#DC2626',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        <path d="M2 8c0-2.2.7-4.3 2-6M22 8a10 10 0 0 0-2-6"/>
      </svg>,
    }

  // Cableado — conector de cable/ethernet, simple
  if (s.includes('cableado') || s.includes('cable'))
    return {
      bg: '#F0FDF4', accent: '#16A34A',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16"/>
        <path d="M4 10h16"/>
        <path d="M7 6V4M17 6V4M7 10v2a5 5 0 0 0 10 0v-2"/>
        <path d="M12 16v4M10 20h4"/>
      </svg>,
    }

  // Almacenamiento — servidor/rack de discos
  if (s.includes('almacen'))
    return {
      bg: '#ECFDF5', accent: '#059669',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2"/>
        <path d="M6 6h.01M6 18h.01"/>
        <path d="M10 6h4M10 18h4"/>
      </svg>,
    }

  // Actuadores — engrane/motor
  if (s.includes('actuador'))
    return {
      bg: '#FFFBEB', accent: '#D97706',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>,
    }

  // Planes de datos — barras de señal celular
  if (s.includes('plan') || s.includes('dato'))
    return {
      bg: '#EFF6FF', accent: '#0369A1',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h2v-4H2zM7 20h2v-8H7zM12 20h2v-12h-2zM17 20h2V4h-2zM22 20h2v-2h-2z" fill="currentColor" stroke="none"/>
      </svg>,
    }

  // Pólizas — escudo con check
  if (s.includes('poliza') || s.includes('póliza'))
    return {
      bg: '#F0F9FF', accent: '#0891B2',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>,
    }

  // Suscripciones — calendario con flecha de renovación
  if (s.includes('suscripcion') || s.includes('suscripción'))
    return {
      bg: '#FDF4FF', accent: '#C026D3',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>,
    }

  // Servicios — llave inglesa
  if (s.includes('servicio'))
    return {
      bg: '#F8FAFC', accent: '#475569',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>,
    }

  // Boletera — impresora de tickets
  if (s.includes('boletera') || s.includes('bolet'))
    return {
      bg: '#FEFCE8', accent: '#CA8A04',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9V2h12v7"/>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
        <rect x="6" y="14" width="12" height="8"/>
      </svg>,
    }

  // Cableado aviación — conector XLR/aviación
  if (s.includes('aviacion') || s.includes('aviación'))
    return {
      bg: '#EEF2FF', accent: '#4338CA',
      icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>
        <path d="M6.34 6.34l2.12 2.12M15.54 15.54l2.12 2.12"/>
      </svg>,
    }

  // Accesorios / Varios / default — caja de producto
  return {
    bg: '#F1F5F9', accent: '#64748B',
    icon: <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 2 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.29 7 12 12 20.71 7"/>
      <line x1="12" y1="22" x2="12" y2="12"/>
    </svg>,
  }
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const meta = getCategoryMeta(product.category)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      className="group"
      style={{
        background: 'var(--c-card)',
        border: '1px solid var(--c-rim)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.18s, transform 0.18s, border-color 0.18s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 8px 24px rgba(15,23,42,0.09)'
        el.style.transform = 'translateY(-2px)'
        el.style.borderColor = 'var(--c-navy-bd)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
        el.style.borderColor = 'var(--c-rim)'
      }}
    >
      {/* Image / Placeholder area */}
      {product.image_url && !imgError ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.image_url}
          alt={product.name}
          onError={() => setImgError(true)}
          style={{ width: '100%', height: '140px', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '140px',
            background: meta.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: meta.accent,
          }}
        >
          {meta.icon}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {/* Category */}
        {product.category && (
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: meta.accent }}>
            {product.category}
          </span>
        )}

        {/* Name */}
        <p style={{ color: 'var(--c-ink)', fontWeight: 700, fontSize: '13px', lineHeight: '1.4', margin: 0 }}>
          {product.name}
        </p>

        {/* SKU */}
        {product.sku && (
          <p style={{ color: 'var(--c-ghost)', fontSize: '10px', fontFamily: 'monospace', margin: 0 }}>
            {product.sku}
          </p>
        )}

        <div style={{ flex: 1, minHeight: '8px' }} />

        {/* Prices */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderTop: '1px solid var(--c-rim)', paddingTop: '10px', marginTop: '4px' }}>
          <p style={{ color: 'var(--c-ghost)', fontSize: '11px', margin: 0 }}>
            $ {formatMXN(product.price_without_tax)}
            <span style={{ marginLeft: '4px', fontSize: '10px' }}>s/IVA</span>
          </p>
          <p style={{ color: 'var(--c-navy)', fontWeight: 700, fontFamily: 'monospace', fontSize: '14px', margin: 0 }}>
            $ {formatMXN(product.price_with_tax)}
            <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--c-ghost)', marginLeft: '4px' }}>c/IVA</span>
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
    return matchSearch && matchCat
  }), [products, search, categoryFilter])

  if (loading) {
    return (
      <div className="py-16 text-center text-sm" style={{ color: 'var(--c-ghost)' }}>
        Cargando catálogo...
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Catálogo</p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
          Catálogo de Productos
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </p>
      </div>

      {/* Search */}
      <div style={{ maxWidth: '640px', margin: '0 auto 20px', width: '100%' }}>
        <div
          className="flex items-center h-12 rounded-full transition-shadow"
          style={{
            background: 'var(--c-card)',
            border: search ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
            boxShadow: search
              ? '0 2px 8px rgba(37,99,235,0.10), 0 0 0 3px rgba(37,99,235,0.06)'
              : '0 1px 4px rgba(15,23,42,0.06)',
          }}
        >
          <div className="flex items-center justify-center w-12 shrink-0" style={{ color: search ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: search ? 0.85 : 0.5 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 h-full bg-transparent outline-none text-sm font-medium"
            style={{ color: 'var(--c-ink)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="flex items-center justify-center w-10 h-10 mr-1 rounded-full transition-colors"
              style={{ color: 'var(--c-dim)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--c-rim)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {(['all', ...categories] as string[]).map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className="text-xs font-semibold transition-all"
            style={{
              padding: '5px 14px',
              borderRadius: '999px',
              cursor: 'pointer',
              border: categoryFilter === cat ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
              background: categoryFilter === cat ? 'var(--c-navy-bg)' : 'var(--c-card)',
              color: categoryFilter === cat ? 'var(--c-navy)' : 'var(--c-dim)',
              boxShadow: categoryFilter === cat ? 'none' : '0 1px 3px rgba(15,23,42,0.04)',
            }}
          >
            {cat === 'all' ? 'Todos' : cat}
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
