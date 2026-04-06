'use client'

import { useState, useEffect } from 'react'

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

interface Props {
  product?: Partial<Product> | null
  onClose: () => void
  onSave: (data: Partial<Product>) => Promise<void>
}

export default function ProductFormModal({ product, onClose, onSave }: Props) {
  const isEdit = !!product?.id
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    description: product?.description ?? '',
    currency: product?.currency ?? 'MXN',
    cost_base: product?.cost_base ?? '0',
    utility_fixed: product?.utility_fixed ?? '0',
    utility_factor: product?.utility_factor ?? '1',
  })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  const labelCls = 'block text-xs font-bold uppercase tracking-widest mb-1.5'
  const labelStyle = { color: 'var(--c-dim)', letterSpacing: '0.1em' }
  const inputBase = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(9,11,16,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-6 md:p-8 flex flex-col gap-6"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 12px 48px rgba(9,11,16,0.32)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold uppercase tracking-wider" style={{ color: 'var(--c-ink)' }}>
            {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button onClick={onClose} className="p-2 hover:opacity-70 transition-opacity" style={{ color: 'var(--c-ghost)' }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Nombre del Producto</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Antena 4G"
              className="w-full rounded-xl px-4 py-2.5 outline-none transition-all focus:ring-2 focus:ring-sky-500/20"
              style={inputBase}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>SKU / Código</label>
            <input
              value={form.sku}
              onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
              placeholder="Ej: ANT-4G-01"
              className="w-full rounded-xl px-4 py-2.5 outline-none transition-all"
              style={inputBase}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Moneda</label>
            <select
              value={form.currency}
              onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 outline-none transition-all appearance-none cursor-pointer"
              style={inputBase}
            >
              <option value="MXN">MXN (Peso Mexicano)</option>
              <option value="USD">USD (Dólar Americano)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Características adicionales..."
              rows={3}
              className="w-full rounded-xl px-4 py-2.5 outline-none transition-all resize-none"
              style={inputBase}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:col-span-2 gap-4">
            <div>
              <label className={labelCls} style={labelStyle}>Costo Base</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.cost_base}
                onChange={e => setForm(f => ({ ...f, cost_base: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 outline-none transition-all text-right"
                style={inputBase}
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Utilidad Fija</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.utility_fixed}
                onChange={e => setForm(f => ({ ...f, utility_fixed: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 outline-none transition-all text-right"
                style={inputBase}
              />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Factor Utilidad</label>
              <input
                type="number"
                step="0.01"
                required
                value={form.utility_factor}
                onChange={e => setForm(f => ({ ...f, utility_factor: e.target.value }))}
                className="w-full rounded-xl px-4 py-2.5 outline-none transition-all text-right"
                style={inputBase}
              />
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-4" style={{ borderTop: '1px solid var(--c-rim)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ color: 'var(--c-dim)', background: 'transparent', border: '1px solid var(--c-rim)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy}
              className="px-8 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--c-navy)', color: '#fff' }}
            >
              {busy ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
