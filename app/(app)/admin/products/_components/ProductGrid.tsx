'use client'

interface Product {
  id: string
  sku: string | null
  name: string
  description: string | null
  currency: string
  cost_base: string
  utility_fixed: string
  utility_factor: string
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
      {products.map((p) => (
        <div
          key={p.id}
          className="group relative flex flex-col p-6 rounded-2xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
          style={{
            background: 'var(--c-card)',
            border: '1px solid var(--c-rim)',
          }}
        >
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-0 group-hover:opacity-10 transition-opacity" style={{ background: 'var(--c-sky)' }}></div>
          
          <div className="relative h-full flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <span className={`badge ${p.currency === 'USD' ? 'badge-sent' : 'badge-process'} text-[10px] px-2 py-0.5`}>
                {p.currency}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
                {p.sku || 'SIN SKU'}
              </span>
            </div>

            <h3 className="font-bold text-xl leading-tight mb-2 tracking-tight group-hover:text-[var(--c-sky)] transition-colors" style={{ color: 'var(--c-ink)' }}>
              {p.name}
            </h3>

            {p.description && (
              <p className="text-sm mb-6 line-clamp-2 leading-relaxed" style={{ color: 'var(--c-dim)' }}>
                {p.description}
              </p>
            )}

            <div className="mt-auto space-y-3 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Costo Base</span>
                <span className="font-mono font-bold" style={{ color: 'var(--c-ink)' }}>
                  $ {Number(p.cost_base).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Utilidad</span>
                <span className="font-mono font-bold" style={{ color: 'var(--c-ink)' }}>
                  $ {Number(p.utility_fixed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-xs uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Factor</span>
                <span className="font-mono font-bold" style={{ color: 'var(--c-sky)' }}>
                   {Number(p.utility_factor).toFixed(2)}x
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-dashed" style={{ borderColor: 'var(--c-rim)' }}>
              <button
                onClick={() => onEdit(p)}
                className="flex-1 text-xs font-bold uppercase tracking-widest py-2.5 rounded-xl transition-all hover:bg-[var(--c-sky-bg)] active:scale-95 text-[var(--c-sky)] border border-[var(--c-sky-bd)]"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(p.id)}
                className="px-3 py-2.5 rounded-xl text-[var(--c-rose)] hover:bg-[rgba(209,44,60,0.08)] transition-colors active:scale-95"
                title="Eliminar"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
