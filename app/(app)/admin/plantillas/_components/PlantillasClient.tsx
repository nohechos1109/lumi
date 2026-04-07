'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from '@/lib/toast'

interface Plantilla {
  id: string
  nombre: string
  requerimiento: string | null
  item_count?: number
}

interface PlantillaItem {
  plantilla_id: string
  sequence: number
  product_id: string | null
  qty: string
  product_name?: string
  product_sku?: string
}

interface PlantillaWithItems extends Plantilla {
  items: PlantillaItem[]
}

interface Product {
  id: string
  name: string
  sku: string | null
}

// ─── PlantillaEditorModal ──────────────────────────────────────────────────────

interface EditorModalProps {
  plantilla: PlantillaWithItems | null // null = create mode
  onClose: () => void
  onSaved: () => void
}

function PlantillaEditorModal({ plantilla, onClose, onSaved }: EditorModalProps) {
  const isEdit = plantilla !== null
  const [nombre, setNombre] = useState(plantilla?.nombre ?? '')
  const [requerimiento, setRequerimiento] = useState(plantilla?.requerimiento ?? '')
  const [saving, setSaving] = useState(false)

  // Items state (edit mode only)
  const [items, setItems] = useState<PlantillaItem[]>(plantilla?.items ?? [])
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showProductSearch, setShowProductSearch] = useState(false)
  const [addingItem, setAddingItem] = useState(false)

  // Load products once in edit mode
  useEffect(() => {
    if (!isEdit) return
    fetch('/api/admin/products')
      .then(r => r.ok ? r.json() : [])
      .then(setProducts)
      .catch(() => {})
  }, [isEdit])

  // Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function refreshItems() {
    if (!plantilla) return
    const res = await fetch(`/api/plantillas/${plantilla.id}`)
    if (res.ok) {
      const data = await res.json()
      setItems(data.items ?? [])
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return
    setSaving(true)
    try {
      const body = { nombre: nombre.trim(), requerimiento: requerimiento.trim() || undefined }
      const res = isEdit
        ? await fetch(`/api/plantillas/${plantilla.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/plantillas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? 'Error al guardar', 'error')
        return
      }
      toast(isEdit ? 'Plantilla actualizada' : 'Plantilla creada', 'success')
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  async function handleAddItem(product: Product) {
    if (!plantilla) return
    setAddingItem(true)
    try {
      const res = await fetch(`/api/plantillas/${plantilla.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id, qty: 1 }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? 'Error al agregar producto', 'error')
        return
      }
      await refreshItems()
      setProductSearch('')
      setShowProductSearch(false)
      toast('Producto agregado', 'success')
    } finally {
      setAddingItem(false)
    }
  }

  async function handleRemoveItem(seq: number) {
    if (!plantilla) return
    const res = await fetch(`/api/plantillas/${plantilla.id}/items/${seq}`, { method: 'DELETE' })
    if (!res.ok) {
      toast('Error al eliminar ítem', 'error')
      return
    }
    await refreshItems()
  }

  async function handleUpdateQty(seq: number, newQty: number) {
    if (!plantilla || newQty < 1) return
    const res = await fetch(`/api/plantillas/${plantilla.id}/items/${seq}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qty: newQty }),
    })
    if (!res.ok) {
      toast('Error al actualizar cantidad', 'error')
      return
    }
    setItems(prev => prev.map(it => it.sequence === seq ? { ...it, qty: String(newQty) } : it))
  }

  const filteredProducts = productSearch.trim()
    ? products.filter(p =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        (p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ?? false)
      )
    : products.slice(0, 10)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plantilla-editor-title"
        className="w-full max-w-2xl rounded-2xl flex flex-col"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--c-rim)' }}>
          <h2
            id="plantilla-editor-title"
            className="text-base font-bold"
            style={{ color: 'var(--c-ink)' }}
          >
            {isEdit ? `Editar Plantilla: ${plantilla.nombre}` : 'Nueva Plantilla'}
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ color: 'var(--c-ghost)' }}
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">
          {/* Fields */}
          <form id="plantilla-form" onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
                Nombre <span style={{ color: 'var(--c-rose)' }}>*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Nombre de la plantilla"
                required
                autoFocus
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-shadow"
                style={{
                  background: 'var(--c-panel)',
                  border: '1px solid var(--c-rim)',
                  color: 'var(--c-ink)',
                }}
                onFocus={e => { e.currentTarget.style.border = '1.5px solid var(--c-navy-bd)' }}
                onBlur={e => { e.currentTarget.style.border = '1px solid var(--c-rim)' }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
                Requerimiento
              </label>
              <textarea
                value={requerimiento}
                onChange={e => setRequerimiento(e.target.value)}
                placeholder="Descripción o requerimiento de la plantilla…"
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{
                  background: 'var(--c-panel)',
                  border: '1px solid var(--c-rim)',
                  color: 'var(--c-ink)',
                }}
                onFocus={e => { e.currentTarget.style.border = '1.5px solid var(--c-navy-bd)' }}
                onBlur={e => { e.currentTarget.style.border = '1px solid var(--c-rim)' }}
              />
            </div>
          </form>

          {/* Items section — only in edit mode */}
          {isEdit && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
                  Productos ({items.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowProductSearch(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                  style={{
                    background: 'var(--c-navy-bg)',
                    color: 'var(--c-navy)',
                    border: '1px solid var(--c-navy-bd)',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Agregar producto
                </button>
              </div>

              {/* Product search */}
              {showProductSearch && (
                <div
                  className="rounded-xl p-3 flex flex-col gap-2"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)' }}
                >
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Buscar por nombre o SKU…"
                    autoFocus
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      background: 'var(--c-card)',
                      border: '1px solid var(--c-rim)',
                      color: 'var(--c-ink)',
                    }}
                    onFocus={e => { e.currentTarget.style.border = '1.5px solid var(--c-navy-bd)' }}
                    onBlur={e => { e.currentTarget.style.border = '1px solid var(--c-rim)' }}
                  />
                  <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <p className="text-xs text-center py-3" style={{ color: 'var(--c-ghost)' }}>
                        {productSearch ? 'Sin resultados' : 'Cargando productos…'}
                      </p>
                    ) : (
                      filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          disabled={addingItem}
                          onClick={() => handleAddItem(p)}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors disabled:opacity-50"
                          style={{ color: 'var(--c-ink)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-card)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                        >
                          <span className="font-medium">{p.name}</span>
                          {p.sku && (
                            <span className="font-mono text-xs ml-2" style={{ color: 'var(--c-ghost)' }}>
                              {p.sku}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Items table */}
              {items.length === 0 ? (
                <div
                  className="text-center py-8 rounded-xl"
                  style={{ border: '1.5px dashed var(--c-rim)' }}
                >
                  <p className="text-sm" style={{ color: 'var(--c-ghost)' }}>
                    Sin productos en esta plantilla
                  </p>
                </div>
              ) : (
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid var(--c-rim)' }}
                >
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                        <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Producto</th>
                        <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Cantidad</th>
                        <th className="px-4 py-3 w-12" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--c-rim)]">
                      {items.map(item => (
                        <tr key={item.sequence} className="tr-hover">
                          <td className="px-4 py-3">
                            <div className="font-medium" style={{ color: 'var(--c-ink)' }}>
                              {item.product_name ?? <span style={{ color: 'var(--c-ghost)' }}>Producto eliminado</span>}
                            </div>
                            {item.product_sku && (
                              <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
                                {item.product_sku}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              value={Math.round(Number(item.qty))}
                              onChange={e => handleUpdateQty(item.sequence, Math.round(Number(e.target.value)))}
                              className="w-16 text-center px-2 py-1 rounded-lg text-sm outline-none"
                              style={{
                                background: 'var(--c-panel)',
                                border: '1px solid var(--c-rim)',
                                color: 'var(--c-ink)',
                              }}
                              onFocus={e => { e.currentTarget.style.border = '1.5px solid var(--c-navy-bd)' }}
                              onBlur={e => { e.currentTarget.style.border = '1px solid var(--c-rim)' }}
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.sequence)}
                              className="flex items-center justify-center w-7 h-7 rounded-lg transition-opacity hover:opacity-70"
                              style={{ color: 'var(--c-rose)', marginLeft: 'auto' }}
                              aria-label="Eliminar ítem"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-4"
          style={{ borderTop: '1px solid var(--c-rim)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
            style={{
              background: 'transparent',
              color: 'var(--c-dim)',
              border: '1px solid var(--c-rim)',
            }}
          >
            Cancelar
          </button>
          <button
            form="plantilla-form"
            type="submit"
            disabled={saving || !nombre.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{
              background: 'var(--c-navy)',
              color: '#FFFFFF',
            }}
          >
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear plantilla'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PlantillasClient ──────────────────────────────────────────────────────────

export default function PlantillasClient() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editPlantilla, setEditPlantilla] = useState<PlantillaWithItems | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Plantilla | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/plantillas')
      if (res.ok) setPlantillas(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function openEdit(plantilla: Plantilla) {
    const res = await fetch(`/api/plantillas/${plantilla.id}`)
    if (!res.ok) { toast('Error al cargar plantilla', 'error'); return }
    const data = await res.json()
    setEditPlantilla({ ...data, item_count: plantilla.item_count })
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/plantillas/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast(data.error ?? 'Error al eliminar', 'error')
    } else {
      toast('Plantilla eliminada', 'success')
    }
    setDeleteConfirm(null)
    await load()
  }

  return (
    <div className="pb-10">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
          style={{ color: 'var(--c-ghost)' }}
        >
          ← Volver al Dashboard Admin
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink)' }}>
            Plantillas
          </h1>
          <p className="text-sm mt-1 font-mono uppercase tracking-tighter" style={{ color: 'var(--c-ghost)' }}>
            {plantillas.length} {plantillas.length === 1 ? 'plantilla' : 'plantillas'}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="group flex items-center justify-center gap-2 text-sm px-6 py-3 rounded-2xl font-bold uppercase tracking-wider transition-all hover:shadow-lg active:scale-95"
          style={{ background: 'var(--c-navy)', color: '#fff', letterSpacing: '0.08em' }}
        >
          <svg className="transition-transform group-hover:rotate-90" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva Plantilla
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--c-rim)', borderTopColor: 'var(--c-navy)' }}
          />
        </div>
      ) : plantillas.length === 0 ? (
        <div
          className="text-center py-24 rounded-2xl"
          style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}
        >
          <p className="text-base font-semibold" style={{ color: 'var(--c-dim)' }}>
            Sin plantillas
          </p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--c-ghost)' }}>
            Crea tu primera plantilla para comenzar.
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>
                    Nombre
                  </th>
                  <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>
                    Requerimiento
                  </th>
                  <th className="text-center px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>
                    Productos
                  </th>
                  <th className="px-6 py-5 w-44" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-rim)]">
                {plantillas.map(p => (
                  <tr key={p.id} className="tr-hover transition-colors">
                    <td className="px-6 py-4 font-semibold" style={{ color: 'var(--c-ink)' }}>
                      {p.nombre}
                    </td>
                    <td className="px-6 py-4 text-sm max-w-xs truncate" style={{ color: 'var(--c-dim)' }}>
                      {p.requerimiento ? (
                        <span title={p.requerimiento}>{p.requerimiento}</span>
                      ) : (
                        <span style={{ color: 'var(--c-ghost)' }}>—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: 'var(--c-navy-bg)', color: 'var(--c-navy)', border: '1px solid var(--c-navy-bd)' }}
                      >
                        {p.item_count ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                          style={{
                            background: 'var(--c-navy-bg)',
                            color: 'var(--c-navy)',
                            border: '1px solid var(--c-navy-bd)',
                          }}
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(p)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                          style={{
                            background: 'var(--c-rose-bg)',
                            color: 'var(--c-rose)',
                            border: '1px solid rgba(209,44,60,0.18)',
                          }}
                        >
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
      )}

      {/* Create modal */}
      {showCreate && (
        <PlantillaEditorModal
          plantilla={null}
          onClose={() => setShowCreate(false)}
          onSaved={async () => {
            setShowCreate(false)
            await load()
          }}
        />
      )}

      {/* Edit modal */}
      {editPlantilla && (
        <PlantillaEditorModal
          plantilla={editPlantilla}
          onClose={() => setEditPlantilla(null)}
          onSaved={async () => {
            setEditPlantilla(null)
            await load()
          }}
        />
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <ConfirmModal
          message={`¿Eliminar la plantilla "${deleteConfirm.nombre}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => handleDelete(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
