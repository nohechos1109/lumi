'use client'

import Image from 'next/image'

interface Product {
  id: string
  sku: string | null
  name: string
  description: string | null
  currency: string
  cost_base: string
  utility_fixed: string
  utility_factor: string
  codigo_sat: string | null
  codigo_proveedor: string | null
  image_url: string | null
}

interface ProductGridProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export default function ProductGrid({ products, onEdit, onDelete }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-2 border-dashed border-[var(--c-rim)] bg-[var(--c-panel)]">
        <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center bg-[var(--c-base)] text-[var(--c-ghost)]">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7.5 4.27 9 5.15"/>
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/>
            <path d="M12 22V12"/>
          </svg>
        </div>
        <p className="text-lg font-bold" style={{ color: 'var(--c-dim)' }}>No se encontraron productos</p>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>Intenta ajustar los filtros de búsqueda.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
      {products.map((p) => (
        <div
          key={p.id}
          onClick={() => onEdit(p)}
          className="product-card group relative flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all duration-300"
        >
          {/* Image area with overlay gradient */}
          <div className="relative w-full h-36 overflow-hidden bg-[var(--c-navy)]">
            {p.image_url ? (
              <>
                <Image
                  src={p.image_url}
                  alt={p.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--c-navy)] via-transparent to-transparent opacity-60" />
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-[var(--c-navy)] to-[#0f2240]">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
                  <path d="m7.5 4.27 9 5.15"/>
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                  <path d="m3.3 7 8.7 5 8.7-5"/>
                  <path d="M12 22V12"/>
                </svg>
              </div>
            )}

            {/* Top badges floating on image */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <span className={`
                inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider backdrop-blur-sm
                ${p.currency === 'USD'
                  ? 'bg-[rgba(28,90,214,0.7)] text-white'
                  : 'bg-[rgba(11,153,98,0.7)] text-white'}
              `}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                {p.currency}
              </span>
              <span className="font-mono text-[9px] font-medium tracking-widest text-white/70 backdrop-blur-sm bg-black/20 px-2 py-0.5 rounded">
                {p.sku || 'SIN SKU'}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="relative flex flex-col flex-1 bg-[var(--c-card)] p-5">
            {/* Name & description */}
            <h3 className="font-heading font-bold text-base leading-snug tracking-tight mb-1 group-hover:text-[var(--c-sky)] transition-colors" style={{ color: 'var(--c-ink)' }}>
              {p.name}
            </h3>
            {p.description && (
              <p className="text-xs mb-4 line-clamp-2 leading-relaxed" style={{ color: 'var(--c-ghost)' }}>
                {p.description}
              </p>
            )}
            {!p.description && <div className="mb-4" />}

            {/* Stats grid */}
            <div className="mt-auto grid grid-cols-3 gap-px rounded-lg overflow-hidden" style={{ background: 'var(--c-rim)' }}>
              <div className="flex flex-col items-center py-3 px-2 bg-[var(--c-base)]">
                <span className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--c-ghost)' }}>
                  Costo
                </span>
                <span className="font-mono text-sm font-bold" style={{ color: 'var(--c-ink)' }}>
                  ${Number(p.cost_base).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-col items-center py-3 px-2 bg-[var(--c-base)]">
                <span className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--c-ghost)' }}>
                  Utilidad
                </span>
                <span className="font-mono text-sm font-bold" style={{ color: 'var(--c-ink)' }}>
                  ${Number(p.utility_fixed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex flex-col items-center py-3 px-2 bg-[var(--c-base)]">
                <span className="text-[9px] uppercase tracking-wider font-semibold mb-1" style={{ color: 'var(--c-ghost)' }}>
                  Factor
                </span>
                <span className="font-mono text-sm font-bold" style={{ color: 'var(--c-sky)' }}>
                  {Number(p.utility_factor).toFixed(2)}x
                </span>
              </div>
            </div>

            {/* Delete action */}
            <div className="flex justify-end mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(p.id) }}
                className="p-2 rounded-lg text-[var(--c-ghost)] hover:text-[var(--c-rose)] hover:bg-[rgba(209,44,60,0.08)] transition-all active:scale-95"
                title="Eliminar"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
