'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

interface SaleOption {
  id: string
  number: string
  customer_name: string
}

interface Props {
  sales: SaleOption[]
  onClose: () => void
}

export default function NewNoteSaleSelector({ sales, onClose }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [navigating, setNavigating] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search) return sales
    const q = search.toLowerCase()
    return sales.filter(s =>
      s.number.toLowerCase().includes(q) ||
      s.customer_name.toLowerCase().includes(q)
    )
  }, [sales, search])

  function handleSelect(saleId: string) {
    setNavigating(saleId)
    router.push(`/ventas/${saleId}/notas/nueva`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 8px 32px rgba(27,52,97,0.18)', maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Nueva Nota</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>Selecciona una venta activa</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--c-ghost)' }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            autoFocus
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por número o cliente..."
            className="w-full rounded-lg pl-9 pr-3 py-2 text-sm"
            style={{ background: 'var(--c-rim)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }}
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--c-rim)' }}>
          {filtered.length === 0 ? (
            <p className="text-center text-xs py-8" style={{ color: 'var(--c-ghost)' }}>
              {sales.length === 0 ? 'No hay ventas activas' : 'Sin resultados'}
            </p>
          ) : (
            filtered.map(s => (
              <button
                key={s.id}
                onClick={() => handleSelect(s.id)}
                disabled={navigating !== null}
                className="w-full text-left px-3 py-2.5 hover:opacity-75 transition-opacity"
                style={{ borderBottom: '1px solid var(--c-rim)' }}
              >
                <p className="font-mono text-xs font-semibold" style={{ color: 'var(--c-navy)' }}>{s.number}</p>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--c-ink)' }}>{s.customer_name}</p>
              </button>
            ))
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
          style={{ background: 'var(--c-rim)', color: 'var(--c-ink)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
