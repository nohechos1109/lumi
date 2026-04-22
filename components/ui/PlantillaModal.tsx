'use client'

import { useState, useEffect } from 'react'

interface Plantilla {
  id: string
  nombre: string
  requerimiento: string | null
  item_count: number
}

interface PlantillaItem {
  product_id: string
  name: string
  description: string | null
  currency: string
  cost_base: number
  utility_fixed: number
  utility_factor: number
  qty: number
  discount_percent: number
}

interface PlantillaDetail {
  id: string
  nombre: string
  requerimiento: string | null
  items: PlantillaItem[]
}

interface Props {
  onApply: (items: PlantillaItem[]) => void
  onClose: () => void
}

export default function PlantillaModal({ onApply, onClose }: Props) {
  const [plantillas, setPlantillas] = useState<Plantilla[]>([])
  const [selected, setSelected] = useState<PlantillaDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [fxRate, setFxRate] = useState(17.85)

  useEffect(() => {
    Promise.all([
      fetch('/api/plantillas').then(r => r.json()),
      fetch('/api/fx').then(r => r.json()),
    ]).then(([plantillasData, fxData]) => {
      setPlantillas(plantillasData)
      setFxRate(Number(fxData.fx_mxn_per_usd) || 17.85)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function selectPlantilla(id: string) {
    setLoadingDetail(true)
    try {
      const r = await fetch(`/api/plantillas/${id}`)
      const data = await r.json()
      setSelected(data)
    } finally {
      setLoadingDetail(false)
    }
  }

  function calcPrice(item: PlantillaItem) {
    const fx = item.currency === 'USD' ? fxRate : 1
    const costBase = Number(item.cost_base) || 0
    const utilityFactor = Number(item.utility_factor) || 0
    const utilityFixed = Number(item.utility_fixed) || 0
    return (costBase * utilityFactor + utilityFixed) * fx
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="plantilla-title"
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 20px 60px rgba(9,11,16,0.35)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}
        >
          <div>
            <h2 id="plantilla-title" className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>
              Plantillas de Equipamiento
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
              Selecciona una plantilla para agregar todos sus productos a la cotización
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none p-1"
            style={{ color: 'var(--c-ghost)' }}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left: plantilla list */}
          <div
            className="w-72 shrink-0 overflow-y-auto flex flex-col"
            style={{ borderRight: '1px solid var(--c-rim)' }}
          >
            {loading ? (
              <div className="p-6 text-sm text-center" style={{ color: 'var(--c-ghost)' }}>
                Cargando...
              </div>
            ) : plantillas.length === 0 ? (
              <div className="p-6 text-sm text-center" style={{ color: 'var(--c-ghost)' }}>
                Sin plantillas disponibles
              </div>
            ) : (
              plantillas.map(pl => {
                const isActive = selected?.id === pl.id
                return (
                  <button
                    key={pl.id}
                    onClick={() => selectPlantilla(pl.id)}
                    className="text-left px-4 py-3 transition-colors"
                    style={{
                      borderBottom: '1px solid var(--c-rim)',
                      background: isActive ? 'var(--c-navy-bg)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--c-navy)' : '3px solid transparent',
                    }}
                  >
                    <p className="text-sm font-semibold" style={{ color: isActive ? 'var(--c-navy)' : 'var(--c-ink)' }}>
                      {pl.nombre}
                    </p>
                    {pl.requerimiento && (
                      <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--c-ghost)' }}>
                        {pl.requerimiento}
                      </p>
                    )}
                    <p className="text-xs mt-1 font-mono" style={{ color: 'var(--c-dim)' }}>
                      {pl.item_count} producto{Number(pl.item_count) !== 1 ? 's' : ''}
                    </p>
                  </button>
                )
              })
            )}
          </div>

          {/* Right: preview */}
          <div className="flex-1 overflow-y-auto">
            {loadingDetail ? (
              <div className="p-8 text-sm text-center" style={{ color: 'var(--c-ghost)' }}>
                Cargando productos...
              </div>
            ) : !selected ? (
              <div className="p-8 text-sm text-center" style={{ color: 'var(--c-ghost)' }}>
                Selecciona una plantilla para ver sus productos
              </div>
            ) : (
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="font-bold text-base" style={{ color: 'var(--c-ink)' }}>{selected.nombre}</h3>
                  {selected.requerimiento && (
                    <p className="text-xs mt-1" style={{ color: 'var(--c-ghost)' }}>{selected.requerimiento}</p>
                  )}
                </div>

                <div
                  className="rounded-xl overflow-hidden text-sm"
                  style={{ border: '1px solid var(--c-rim)' }}
                >
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                        <th className="text-left px-3 py-2.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Producto</th>
                        <th className="text-right px-3 py-2.5 text-xs font-bold uppercase tracking-wider w-16" style={{ color: 'var(--c-ghost)' }}>Cant.</th>
                        <th className="text-right px-3 py-2.5 text-xs font-bold uppercase tracking-wider w-24" style={{ color: 'var(--c-ghost)' }}>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, i) => (
                        <tr
                          key={i}
                          style={{ borderTop: '1px solid var(--c-rim)' }}
                        >
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-xs" style={{ color: 'var(--c-ink)' }}>{item.name}</p>
                            {item.description && (
                              <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--c-ghost)' }}>{item.description}</p>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                            {item.qty}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono text-xs" style={{ color: 'var(--c-ink)' }}>
                            ${calcPrice(item).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ borderTop: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}
        >
          <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>
            {selected ? `${selected.items.length} producto${selected.items.length !== 1 ? 's' : ''} se agregarán a la cotización` : 'Selecciona una plantilla'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg"
              style={{ color: 'var(--c-dim)', background: 'transparent', border: '1px solid var(--c-rim)' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => selected && onApply(selected.items)}
              disabled={!selected}
              className="text-sm px-5 py-2 rounded-lg font-semibold transition-opacity disabled:opacity-40"
              style={{ background: 'var(--c-navy)', color: '#fff' }}
            >
              Aplicar Plantilla
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
