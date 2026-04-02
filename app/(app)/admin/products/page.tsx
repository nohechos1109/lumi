'use client'

import { useState, useEffect } from 'react'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Product { id: string; sku: string | null; name: string; description: string | null; currency: string; cost_base: string; utility_fixed: string; utility_factor: string }

const empty = { sku: '', name: '', description: '', currency: 'MXN', cost_base: '0', utility_fixed: '0', utility_factor: '1' }

const inputBase = { background: 'var(--c-panel)' }
const labelCls = 'block text-xs font-bold uppercase tracking-widest mb-2'
const labelStyle = { color: 'var(--c-dim)', letterSpacing: '0.1em' }
const cellStyle = { borderTop: '1px solid var(--c-rim)' }

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [form, setForm] = useState(empty)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Product>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function load() {
    const r = await fetch('/api/admin/products')
    setProducts(await r.json())
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm(empty)
    setAdding(false)
    load()
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setEditForm({ name: p.name, description: p.description ?? '', sku: p.sku ?? '', currency: p.currency, cost_base: p.cost_base, utility_fixed: p.utility_fixed, utility_factor: p.utility_factor })
  }

  async function saveEdit() {
    if (!editingId) return
    await fetch(`/api/admin/products/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setEditingId(null)
    setEditForm({})
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    load()
  }

  const editInput = (field: keyof typeof editForm, opts?: { type?: string; w?: string; step?: string }) => (
    <input
      type={opts?.type ?? 'text'}
      step={opts?.step}
      value={editForm[field] as string ?? ''}
      onChange={e => setEditForm(f => ({ ...f, [field]: e.target.value }))}
      style={{ ...inputBase, width: opts?.w ?? '100%' }}
      className="text-right"
    />
  )

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
          onClick={() => setAdding(v => !v)}
          className="text-sm px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-opacity hover:opacity-85"
          style={{
            background: adding ? 'var(--c-rim-hi)' : 'var(--c-gold)',
            color: adding ? 'var(--c-dim)' : '#090B10',
            letterSpacing: '0.08em',
          }}
        >
          {adding ? 'Cancelar' : '+ Nuevo Producto'}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim-hi)' }}
        >
          {(['name', 'sku', 'description'] as const).map(field => (
            <div key={field} className={field === 'description' ? 'col-span-2' : ''}>
              <label className={labelCls} style={labelStyle}>{field === 'name' ? 'Nombre' : field === 'sku' ? 'SKU' : 'Descripción'}</label>
              <input
                value={form[field] ?? ''}
                onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                style={{ ...inputBase, width: '100%' }}
              />
            </div>
          ))}
          <div>
            <label className={labelCls} style={labelStyle}>Moneda</label>
            <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={{ ...inputBase, width: '100%' }}>
              <option>MXN</option><option>USD</option>
            </select>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Costo base</label>
            <input type="number" step="0.01" value={form.cost_base} onChange={e => setForm(f => ({ ...f, cost_base: e.target.value }))} style={{ ...inputBase, width: '100%' }} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Utilidad fija</label>
            <input type="number" step="0.01" value={form.utility_fixed} onChange={e => setForm(f => ({ ...f, utility_fixed: e.target.value }))} style={{ ...inputBase, width: '100%' }} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Factor utilidad</label>
            <input type="number" step="0.01" value={form.utility_factor} onChange={e => setForm(f => ({ ...f, utility_factor: e.target.value }))} style={{ ...inputBase, width: '100%' }} />
          </div>
          <div className="col-span-1 sm:col-span-2 md:col-span-3 flex gap-3 pt-1" style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1rem' }}>
            <button type="submit" className="px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-wider" style={{ background: 'var(--c-gold)', color: '#090B10' }}>
              Guardar
            </button>
            <button type="button" onClick={() => setAdding(false)} className="px-5 py-2 rounded-xl text-sm" style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Nombre</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>SKU</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Descripción</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Moneda</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Costo</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Util. Fija</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Factor</th>
              <th className="px-5 py-4 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => {
              const isEditing = editingId === p.id
              return (
                <tr
                  key={p.id}
                  className={isEditing ? '' : 'tr-hover'}
                  style={{
                    ...cellStyle,
                    background: isEditing ? 'var(--c-navy-bg)' : undefined,
                  }}
                >
                  <td className="px-5 py-3.5" style={{ color: 'var(--c-ink)' }}>
                    {isEditing ? editInput('name') : p.name}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                    {isEditing ? editInput('sku') : (p.sku ?? '—')}
                  </td>
                  <td className="px-5 py-3.5 text-xs truncate max-w-[200px]" style={{ color: 'var(--c-dim)' }}>
                    {isEditing ? editInput('description', { w: '100%' }) : (p.description ?? '—')}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                    {isEditing ? (
                      <select value={editForm.currency ?? 'MXN'} onChange={e => setEditForm(f => ({ ...f, currency: e.target.value }))} style={{ ...inputBase, width: '5rem' }}>
                        <option>MXN</option><option>USD</option>
                      </select>
                    ) : p.currency}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs" style={{ color: 'var(--c-ink)' }}>
                    {isEditing ? editInput('cost_base', { type: 'number', step: '0.01', w: '6rem' }) : `$${Number(p.cost_base).toFixed(2)}`}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs" style={{ color: 'var(--c-ink)' }}>
                    {isEditing ? editInput('utility_fixed', { type: 'number', step: '0.01', w: '6rem' }) : `$${Number(p.utility_fixed).toFixed(2)}`}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-xs" style={{ color: 'var(--c-ink)' }}>
                    {isEditing ? editInput('utility_factor', { type: 'number', step: '0.01', w: '5rem' }) : Number(p.utility_factor).toFixed(2)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex gap-3 justify-end items-center">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded bg-mint text-navy hover:opacity-80 transition-all"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded border border-rim text-ghost hover:bg-rim transition-all"
                          >
                            X
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(p)} className="btn-edit text-xs">
                            Editar
                          </button>
                          <button onClick={() => setDeleteId(p.id)} className="btn-delete text-xs">
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </div>
      </div>

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
