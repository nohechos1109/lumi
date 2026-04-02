'use client'

import { useState, useEffect } from 'react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import ProductFormModal from './_components/ProductFormModal'

interface Product { id: string; sku: string | null; name: string; description: string | null; currency: string; cost_base: string; utility_fixed: string; utility_factor: string }

const cellStyle = { borderTop: '1px solid var(--c-rim)' }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [showModal, setShowModal] = useState(false)
  const [productToEdit, setProductToEdit] = useState<Product | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function load() {
    const r = await fetch('/api/admin/products')
    setProducts(await r.json())
  }

  useEffect(() => { load() }, [])

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
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase" style={{ color: 'var(--c-ink)', letterSpacing: '0.1em' }}>
            Productos
          </h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'var(--c-ghost)' }}>
            {products.length} {products.length === 1 ? 'producto' : 'productos'}
          </p>
        </div>
        <button
          onClick={() => { setProductToEdit(null); setShowModal(true) }}
          className="text-sm px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-opacity hover:opacity-85"
          style={{
            background: 'var(--c-gold)',
            color: '#090B10',
            letterSpacing: '0.08em',
          }}
        >
          + Nuevo Producto
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Nombre</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>SKU</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Descripción</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Moneda</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Costo</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Util. Fija</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Factor</th>
              <th className="px-5 py-4 w-28"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
                <tr key={p.id} className="tr-hover" style={cellStyle}>
                  <td className="px-5 py-3.5" style={{ color: 'var(--c-ink)' }}>
                    {p.name}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                    {p.sku ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: 'var(--c-dim)' }}>
                    {p.description ?? '—'}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                    {p.currency}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs" style={{ color: 'var(--c-ink)' }}>
                    $ {Number(p.cost_base).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs" style={{ color: 'var(--c-ink)' }}>
                    $ {Number(p.utility_fixed).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs" style={{ color: 'var(--c-ink)' }}>
                    {Number(p.utility_factor).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => { setProductToEdit(p); setShowModal(true) }} className="btn-edit text-xs">
                        Editar
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="btn-delete text-xs">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {showModal && (
        <ProductFormModal
          product={productToEdit}
          onClose={() => { setShowModal(false); setProductToEdit(null) }}
          onSave={handleSave}
        />
      )}

      {deleteId && (
        <ConfirmModal
          message="¿Eliminar este producto? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={() => { handleDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
