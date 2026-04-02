'use client'

import { useState, useEffect } from 'react'
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
  utility_factor: string 
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [currencyFilter, setCurrencyFilter] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  async function load() {
    const r = await fetch('/api/admin/products')
    setProducts(await r.json())
  }

  useEffect(() => { load() }, [])

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    const matchesCurrency = currencyFilter === '' || p.currency === currencyFilter

    return matchesSearch && matchesCurrency
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
            background: 'var(--c-gold)',
            color: '#090B10',
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
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 rounded-xl shadow-sm" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)', backgroundClip: 'padding-box' }}>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-12 pr-4 h-11 rounded-lg outline-none focus:ring-2 focus:ring-[var(--c-sky)] transition-all text-sm font-medium"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              background: 'var(--c-panel)', 
              border: '1px solid var(--c-rim)',
              color: 'var(--c-ink)'
            }}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40" style={{ color: 'var(--c-ghost)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="relative min-w-[180px]">
            <select
              className="w-full appearance-none px-4 py-3 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-[var(--c-sky)] transition-all cursor-pointer"
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              style={{ 
                background: 'var(--c-base)', 
                border: '1px solid var(--c-rim)',
                color: 'var(--c-ink)'
              }}
            >
              <option value="">Todas las monedas</option>
              <option value="MXN">MXN - Peso Mexicano</option>
              <option value="USD">USD - Dólar</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--c-ghost)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
          </div>

          <div className="flex p-1 rounded-xl" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-base)' }}>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center w-11 h-11 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[var(--c-sky)]' : 'text-[var(--c-ghost)] hover:text-[var(--c-dim)]'}`}
              title="Vista de lista"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center w-11 h-11 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[var(--c-sky)]' : 'text-[var(--c-ghost)] hover:text-[var(--c-dim)]'}`}
              title="Vista de cuadrícula"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Nombre del Producto</th>
                <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>SKU</th>
                <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Moneda</th>
                <th className="text-right px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Costo Base</th>
                <th className="text-right px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Util. Fija</th>
                <th className="text-right px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Factor</th>
                <th className="px-6 py-5 w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-rim)]">
              {filteredProducts.map(p => (
                  <tr key={p.id} className="tr-hover group">
                    <td className="px-6 py-4.5">
                      <div className="font-bold text-[var(--c-ink)]">{p.name}</div>
                      {p.description && <div className="text-[10px] leading-tight mt-0.5 truncate max-w-[200px]" style={{ color: 'var(--c-ghost)' }}>{p.description}</div>}
                    </td>
                    <td className="px-6 py-4.5 font-mono text-[11px]" style={{ color: 'var(--c-dim)' }}>
                      {p.sku ?? '—'}
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
                    <td className="px-6 py-4.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setProductToEdit(p); setShowModal(true) }} className="btn-edit text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded hover:bg-[var(--c-sky-bg)]">
                          Editar
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="btn-delete text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded hover:bg-[var(--c-rose-bg)]">
                          Borrar
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
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
