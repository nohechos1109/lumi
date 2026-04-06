'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

const PRODUCT_CATEGORIES = [
  'Varios', 'Servicios', 'Polizas', 'Suscripciones', 'Grabadores', 'Almacenamiento',
  'Camaras', 'Cableado aviacion', 'Cableado especializado CP4', 'Cableado especializado',
  'Pantallas', 'Boletera', 'Accesorios', 'Actuadores', 'Planes de datos', 'Alarma inalambrica',
] as const

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
  category: string | null
}

interface Props {
  product?: Partial<Product> | null
  onClose: () => void
  onSave: (data: Partial<Product>) => Promise<void>
  onDelete?: () => void
}

export default function ProductFormModal({ product, onClose, onSave, onDelete }: Props) {
  const isEdit = !!product?.id
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    description: product?.description ?? '',
    currency: product?.currency ?? 'MXN',
    cost_base: product?.cost_base ?? '0',
    utility_fixed: product?.utility_fixed ?? '0',
    utility_factor: product?.utility_factor ?? '1',
    codigo_sat: product?.codigo_sat ?? '',
    codigo_proveedor: product?.codigo_proveedor ?? '',
    image_url: product?.image_url ?? '',
    category: product?.category ?? 'Varios',
  })
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function uploadFile(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/products/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error ?? 'Error al subir imagen')
        return
      }
      const { url } = await res.json()
      setForm(f => ({ ...f, image_url: url }))
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

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
        className="w-full max-w-2xl lg:max-w-5xl rounded-2xl p-6 md:p-8 flex flex-col gap-6"
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Image upload */}
          <div className="md:col-span-2 lg:col-span-2">
            <label className={labelCls} style={labelStyle}>Imagen del Producto</label>
            <div
              className={`relative flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                dragOver ? 'ring-2 ring-sky-500/40' : ''
              }`}
              style={{
                background: 'var(--c-panel)',
                border: dragOver ? '2px dashed var(--c-sky)' : '2px dashed var(--c-rim)',
                minHeight: form.image_url ? 'auto' : '120px',
              }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />

              {uploading ? (
                <div className="flex flex-col items-center gap-2 py-6">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--c-sky)', borderTopColor: 'transparent' }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-dim)' }}>Subiendo...</span>
                </div>
              ) : form.image_url ? (
                <div className="relative w-full p-3">
                  <div className="relative w-full h-40 rounded-lg overflow-hidden">
                    <Image
                      src={form.image_url}
                      alt="Preview"
                      fill
                      className="object-contain"
                      sizes="(max-width: 672px) 100vw, 672px"
                    />
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
                      Click o arrastra para cambiar
                    </span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, image_url: '' })) }}
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded hover:bg-[rgba(209,44,60,0.08)] transition-colors"
                      style={{ color: 'var(--c-rose)' }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--c-ghost)' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="text-xs font-semibold" style={{ color: 'var(--c-dim)' }}>
                    Arrastra una imagen o haz click para seleccionar
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--c-ghost)' }}>
                    JPG, PNG o WebP (máx. 5 MB)
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-2">
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

          <div className="md:col-span-2 lg:col-span-2">
            <label className={labelCls} style={labelStyle}>Categoría</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full rounded-xl px-4 py-2.5 outline-none transition-all appearance-none cursor-pointer"
              style={inputBase}
            >
              {PRODUCT_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-4">
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

          <div>
            <label className={labelCls} style={labelStyle}>Código SAT</label>
            <input
              value={form.codigo_sat}
              onChange={e => setForm(f => ({ ...f, codigo_sat: e.target.value }))}
              placeholder="Ej: 43211508"
              className="w-full rounded-xl px-4 py-2.5 outline-none transition-all"
              style={inputBase}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Código Proveedor</label>
            <input
              value={form.codigo_proveedor}
              onChange={e => setForm(f => ({ ...f, codigo_proveedor: e.target.value }))}
              placeholder="Ej: PROV-001"
              className="w-full rounded-xl px-4 py-2.5 outline-none transition-all"
              style={inputBase}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:col-span-2 lg:col-span-4 gap-4">
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

          <div className="md:col-span-2 lg:col-span-4 flex items-center pt-4" style={{ borderTop: '1px solid var(--c-rim)' }}>
            {isEdit && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:bg-[var(--c-rose-bg)]"
                style={{ color: 'var(--c-rose)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Eliminar
              </button>
            )}
            <div className="flex gap-3 ml-auto">
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
                disabled={busy || uploading}
                className="px-8 py-2.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--c-navy)', color: '#fff' }}
              >
                {busy ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
