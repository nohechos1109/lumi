'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import type { ServiceMaterial } from '@/lib/queries/servicios'

interface Product {
  id: string
  name: string
  sku: string | null
  public_price: string | null
}

interface Props {
  serviceId: string
  materials: ServiceMaterial[]
  canEdit: boolean
}

const inp = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }

export default function MaterialsEditor({ serviceId, materials, canEdit }: Props) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [notes, setNotes] = useState('')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts).catch(() => {})
  }, [])

  const filtered = useMemo(() => {
    if (!search) return products.slice(0, 15)
    const q = search.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    ).slice(0, 15)
  }, [products, search])

  function selectProduct(p: Product) {
    setSelectedProductId(p.id)
    setSearch(p.name)
    setUnitPrice(p.public_price ?? '0')
  }

  async function handleAdd() {
    if (!selectedProductId) {
      toast('Selecciona un producto', 'error')
      return
    }
    setAdding(true)
    try {
      const res = await fetch(`/api/servicios/services/${serviceId}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductId,
          quantity: Number(quantity) || 1,
          unit_price: Number(unitPrice) || 0,
          notes: notes || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast(err.error || 'Error al agregar material', 'error')
        return
      }
      toast('Material agregado', 'success')
      setSelectedProductId('')
      setSearch('')
      setQuantity('1')
      setUnitPrice('')
      setNotes('')
      setShowForm(false)
      router.refresh()
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(materialId: string) {
    const res = await fetch(`/api/servicios/services/${serviceId}/materials?material_id=${materialId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      toast('Error al eliminar material', 'error')
      return
    }
    toast('Material eliminado', 'success')
    router.refresh()
  }

  const fmt = (v: string | number) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })
  const total = materials.reduce((s, m) => s + Number(m.quantity) * Number(m.unit_price), 0)

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
          Materiales utilizados
        </h2>
        {canEdit && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: '#B45309', cursor: 'pointer', border: 'none' }}
          >
            + Agregar
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="rounded-xl p-4 mb-4" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar producto por nombre o SKU..."
                value={search}
                onChange={e => { setSearch(e.target.value); setSelectedProductId('') }}
                className="w-full text-sm rounded-lg px-3 py-2"
                style={inp}
              />
              {search && !selectedProductId && filtered.length > 0 && (
                <div
                  className="absolute z-10 mt-1 w-full rounded-lg overflow-hidden shadow-lg max-h-48 overflow-y-auto"
                  style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
                >
                  {filtered.map(p => (
                    <button
                      key={p.id}
                      onClick={() => selectProduct(p)}
                      className="w-full text-left px-3 py-2 text-sm hover:opacity-80"
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--c-ink)' }}
                    >
                      <span className="font-semibold">{p.name}</span>
                      {p.sku && <span className="ml-2 text-xs font-mono" style={{ color: 'var(--c-ghost)' }}>{p.sku}</span>}
                      {p.public_price && <span className="ml-2 text-xs" style={{ color: 'var(--c-dim)' }}>${fmt(p.public_price)}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-dim)' }}>Cantidad</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2"
                  style={inp}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-dim)' }}>Precio unitario</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={e => setUnitPrice(e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2"
                  style={inp}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--c-dim)' }}>Notas</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full text-sm rounded-lg px-3 py-2"
                  style={inp}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={adding || !selectedProductId}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{
                  background: adding || !selectedProductId ? 'var(--c-rim-hi)' : '#B45309',
                  cursor: adding || !selectedProductId ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}
              >
                {adding ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {materials.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--c-dim)' }}>Sin materiales registrados.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--c-rim)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Producto</th>
                <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Cant.</th>
                <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>P. Unit.</th>
                <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Subtotal</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Notas</th>
                {canEdit && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody>
              {materials.map(m => {
                const sub = Number(m.quantity) * Number(m.unit_price)
                return (
                  <tr key={m.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                    <td className="px-4 py-2.5" style={{ color: 'var(--c-ink)' }}>
                      {m.product_name}
                      {m.product_sku && (
                        <span className="ml-2 text-xs font-mono" style={{ color: 'var(--c-ghost)' }}>{m.product_sku}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>{fmt(m.quantity)}</td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(m.unit_price)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>${fmt(sub)}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: 'var(--c-dim)' }}>{m.notes ?? '—'}</td>
                    {canEdit && (
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-xs hover:underline"
                          style={{ color: '#991B1B', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        >
                          Quitar
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--c-panel)' }}>
                <td colSpan={3} className="px-4 py-2.5 text-right text-xs font-bold uppercase" style={{ color: 'var(--c-ghost)' }}>
                  Total
                </td>
                <td className="px-4 py-2.5 text-right font-mono font-bold" style={{ color: '#B45309' }}>
                  ${fmt(total)}
                </td>
                <td />
                {canEdit && <td />}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
