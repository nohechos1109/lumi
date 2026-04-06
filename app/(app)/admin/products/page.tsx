'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ProductFormModal from './_components/ProductFormModal'
import ProductGrid from './_components/ProductGrid'

interface Product {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  currency: string;
  cost_base: string;
  utility_fixed: string;
  utility_factor: string;
  codigo_sat: string | null;
  codigo_proveedor: string | null;
  image_url: string | null;
  category: string | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  async function load() {
    const r = await fetch('/api/admin/products')
    setProducts(await r.json())
  }

  useEffect(() => { load() }, [])

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[]

  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)

    const matchesCurrency = currencyFilter === '' || p.currency === currencyFilter
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter

    return matchesSearch && matchesCurrency && matchesCategory
  })

  async function handleSave(data: Partial<Product>) {
    if (productToEdit) {
      await fetch(`/api/admin/products/${productToEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } else {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    }
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="pb-10">
      <div className="mb-6">
        <Link 
          href="/admin"
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
          style={{ color: 'var(--c-ghost)' }}
        >
          ← Volver al Dashboard Admin
        </Link>
      </div>

      {/* Header section */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink)' }}>
            Productos
          </h1>
          <p className="text-sm mt-1 font-mono uppercase tracking-tighter" style={{ color: 'var(--c-ghost)' }}>
            {filteredProducts.length} {filteredProducts.length === 1 ? 'resultado' : 'resultados'} / {products.length} total
          </p>
        </div>
        <button
          onClick={() => { setProductToEdit(null); setShowModal(true) }}
          className="group flex items-center justify-center gap-2 text-sm px-6 py-3 rounded-2xl font-bold uppercase tracking-wider transition-all hover:shadow-lg active:scale-95"
          style={{
            background: 'var(--c-navy)',
            color: '#fff',
            letterSpacing: '0.08em',
          }}
        >
          <svg className="transition-transform group-hover:rotate-90" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Producto
        </button>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col gap-4 mb-8">
        {/* Search bar — Google-style */}
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          <div
            className="flex items-center h-12 rounded-full transition-shadow"
            style={{
              background: 'var(--c-card)',
              border: searchQuery ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
              boxShadow: searchQuery
                ? '0 2px 8px rgba(27,52,97,0.12), 0 0 0 3px rgba(27,52,97,0.06)'
                : '0 1px 6px rgba(27,52,97,0.08)',
            }}
          >
            <div className="flex items-center justify-center w-12 shrink-0" style={{ color: searchQuery ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: searchQuery ? 0.85 : 0.5, transition: 'color 0.2s, opacity 0.2s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              className="flex-1 h-full bg-transparent outline-none text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ color: 'var(--c-ink)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center justify-center w-10 h-10 mr-1 rounded-full transition-colors"
                style={{ color: 'var(--c-dim)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-rim)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                aria-label="Limpiar búsqueda"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filters — pill chips + view toggle */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 mr-1" style={{ color: 'var(--c-ghost)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
            </svg>
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              style={{ background: currencyFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: currencyFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: currencyFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: currencyFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
            >
              <option value="">Moneda</option>
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: currencyFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ background: categoryFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: categoryFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: categoryFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: categoryFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
            >
              <option value="">Categoría</option>
              {categories.sort().map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: categoryFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div className="flex p-0.5 rounded-full ml-2" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${viewMode === 'list' ? 'shadow-sm' : 'hover:opacity-70'}`}
              style={{ background: viewMode === 'list' ? 'var(--c-navy-bg)' : 'transparent', color: viewMode === 'list' ? 'var(--c-navy)' : 'var(--c-ghost)' }}
              title="Vista de lista"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${viewMode === 'grid' ? 'shadow-sm' : 'hover:opacity-70'}`}
              style={{ background: viewMode === 'grid' ? 'var(--c-navy-bg)' : 'transparent', color: viewMode === 'grid' ? 'var(--c-navy)' : 'var(--c-ghost)' }}
              title="Vista de cuadrícula"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'list' ? (
        <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1200px]">
            <thead>
              <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                <th className="w-16 px-4 py-5"></th>
                <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Nombre del Producto</th>
                <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>SKU</th>
                <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Categoría</th>
                <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Moneda</th>
                <th className="text-right px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Costo Base</th>
                <th className="text-right px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Util. Fija</th>
                <th className="text-right px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Factor</th>
                <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Código SAT</th>
                <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Código Proveedor</th>
                <th className="px-6 py-5 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-rim)]">
              {filteredProducts.map(p => (
                  <tr key={p.id} className="tr-hover group cursor-pointer" onClick={() => { setProductToEdit(p); setShowModal(true) }}>
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: 'var(--c-panel)' }}>
                        {p.image_url ? (
                          <Image src={p.image_url} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--c-ghost)', opacity: 0.4 }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                          </svg>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-[var(--c-ink)]">{p.name}</div>
                      {p.description && <div className="text-[10px] leading-tight mt-0.5 truncate max-w-[200px]" style={{ color: 'var(--c-ghost)' }}>{p.description}</div>}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-[11px]" style={{ color: 'var(--c-dim)' }}>
                      {p.sku ?? '—'}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'var(--c-navy-bg)', color: 'var(--c-navy)', border: '1px solid var(--c-navy-bd)' }}>
                        {p.category ?? 'Varios'}
                      </span>
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`badge ${p.currency === 'USD' ? 'badge-sent' : 'badge-process'} text-[10px]`}>
                        {p.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono text-[11px] font-bold" style={{ color: 'var(--c-ink)' }}>
                      $ {Number(p.cost_base).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono text-[11px]" style={{ color: 'var(--c-dim)' }}>
                      $ {Number(p.utility_fixed).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4.5 text-right font-mono text-[11px] font-bold" style={{ color: 'var(--c-sky)' }}>
                      {Number(p.utility_factor).toFixed(2)}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-[11px]" style={{ color: 'var(--c-dim)' }}>
                      {p.codigo_sat ?? '—'}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-[11px]" style={{ color: 'var(--c-dim)' }}>
                      {p.codigo_proveedor ?? '—'}
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      <button onClick={(e) => { e.stopPropagation(); setDeleteId(p.id) }} className="btn-delete text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded hover:bg-[var(--c-rose-bg)]">
                        Borrar
                      </button>
                    </td>
                  </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-20 text-center">
                    <p className="text-[var(--c-ghost)] font-mono text-sm uppercase tracking-widest">No se encontraron productos</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      ) : (
        <ProductGrid
          products={filteredProducts}
          onEdit={(p) => { setProductToEdit(p); setShowModal(true) }}
          onDelete={setDeleteId}
        />
      )}

      {showModal && (
        <ProductFormModal
          product={productToEdit}
          onClose={() => { setShowModal(false); setProductToEdit(null) }}
          onSave={handleSave}
        />
      )}

      {deleteId && (
        <ConfirmModal
          message="¿Eliminar este producto? Esta acción no se puede deshacer y podría afectar procesos actuales."
          confirmLabel="Eliminar Definitivamente"
          onConfirm={() => { handleDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
