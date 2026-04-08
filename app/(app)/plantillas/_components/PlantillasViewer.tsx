'use client'

import { useState, useEffect, useCallback } from 'react'

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

// ─── Detail modal (read-only) ─────────────────────────────────────────────────

function PlantillaDetailModal({ plantilla, onClose }: { plantilla: Plantilla; onClose: () => void }) {
  const [items, setItems] = useState<PlantillaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/plantillas/${plantilla.id}`)
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => setItems(data.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [plantilla.id])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="plantilla-detail-title"
        className="w-full max-w-xl rounded-2xl flex flex-col"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
          maxHeight: '80vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--c-rim)' }}>
          <div>
            <h2 id="plantilla-detail-title" className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>
              {plantilla.nombre}
            </h2>
            {plantilla.requerimiento && (
              <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
                {plantilla.requerimiento}
              </p>
            )}
          </div>
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
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div
                className="w-7 h-7 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--c-rim)', borderTopColor: 'var(--c-navy)' }}
              />
            </div>
          ) : items.length === 0 ? (
            <div
              className="text-center py-10 rounded-xl"
              style={{ border: '1.5px dashed var(--c-rim)' }}
            >
              <p className="text-sm" style={{ color: 'var(--c-ghost)' }}>Sin productos en esta plantilla</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-rim)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Producto</th>
                    <th className="text-center px-4 py-3 text-xs font-bold uppercase tracking-widest w-24" style={{ color: 'var(--c-ghost)' }}>Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--c-rim)]">
                  {items.map(item => (
                    <tr key={item.sequence}>
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
                      <td className="px-4 py-3 text-center font-mono text-sm" style={{ color: 'var(--c-ink)' }}>
                        {Math.round(Number(item.qty))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4" style={{ borderTop: '1px solid var(--c-rim)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
            style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── PlantillasViewer ─────────────────────────────────────────────────────────

export default function PlantillasViewer() {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Plantilla | null>(null)

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

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl font-bold uppercase tracking-widest" style={{ color: 'var(--c-ink)' }}>
          Plantillas
        </h1>
        <p className="text-sm mt-1 font-mono uppercase tracking-tighter" style={{ color: 'var(--c-ghost)' }}>
          {plantillas.length} {plantillas.length === 1 ? 'plantilla' : 'plantillas'}
        </p>
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
          <p className="text-base font-semibold" style={{ color: 'var(--c-dim)' }}>Sin plantillas</p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--c-ghost)' }}>No hay plantillas disponibles aún.</p>
        </div>
      ) : (
        <div
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Nombre</th>
                  <th className="text-left px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Requerimiento</th>
                  <th className="text-center px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--c-ghost)' }}>Productos</th>
                  <th className="px-6 py-5 w-32" />
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
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelected(p)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                        style={{
                          background: 'var(--c-navy-bg)',
                          color: 'var(--c-navy)',
                          border: '1px solid var(--c-navy-bd)',
                        }}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <PlantillaDetailModal
          plantilla={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
