'use client'

import { useState, useEffect, useMemo } from 'react'

interface Unidad {
  id: string
  name: string
  empresa_name?: string | null
  ruta_name?: string | null
}

interface Props {
  value: string
  onChange: (id: string) => void
  customerId?: string | null
  rutaId?: string | null
  disabled?: boolean
  placeholder?: string
  inputStyle?: React.CSSProperties
}

export default function UnidadSearchSelect({
  value,
  onChange,
  customerId,
  rutaId,
  disabled,
  placeholder = 'Buscar unidad...',
  inputStyle,
}: Props) {
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams()
    if (customerId) params.set('customer_id', customerId)
    if (rutaId) params.set('ruta_id', rutaId)
    const qs = params.toString()
    fetch(`/api/unidades${qs ? `?${qs}` : ''}`)
      .then(r => r.json())
      .then(d => setUnidades(Array.isArray(d) ? d : []))
      .catch(() => setUnidades([]))
  }, [customerId, rutaId])

  // Clear selection if it's no longer in the filtered list
  useEffect(() => {
    if (value && unidades.length > 0 && !unidades.find(u => u.id === value)) {
      onChange('')
    }
  }, [unidades, value, onChange])

  const selected = unidades.find(u => u.id === value)

  const filtered = useMemo(() => {
    if (!search) return unidades.slice(0, 12)
    const q = search.toLowerCase()
    return unidades.filter(u =>
      u.name.toLowerCase().includes(q) ||
      (u.empresa_name ?? '').toLowerCase().includes(q) ||
      (u.ruta_name ?? '').toLowerCase().includes(q)
    ).slice(0, 12)
  }, [unidades, search])

  const defaultInputStyle: React.CSSProperties = {
    background: 'var(--c-panel)',
    border: '1px solid var(--c-rim)',
    color: 'var(--c-ink)',
    outline: 'none',
    ...inputStyle,
  }

  if (selected) {
    return (
      <div
        className="flex items-start justify-between rounded-xl px-3 py-2"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}
      >
        <div>
          <div className="text-sm font-medium" style={{ color: '#1D4ED8' }}>{selected.name}</div>
          {(selected.empresa_name || selected.ruta_name) && (
            <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              {[selected.empresa_name, selected.ruta_name].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs hover:opacity-70 ml-2 mt-0.5 flex-shrink-0"
            style={{ color: '#6B7280', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            ✕
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        onChange={e => setSearch(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        disabled={disabled}
        className="w-full text-sm rounded-xl px-4 py-2.5"
        style={defaultInputStyle}
      />
      {showDropdown && (
        <div
          className="absolute z-10 w-full mt-1 rounded-lg overflow-y-auto"
          style={{
            background: 'var(--c-card)',
            border: '1px solid var(--c-rim)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: '260px',
          }}
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm" style={{ color: 'var(--c-ghost)' }}>
              {unidades.length === 0 ? 'Sin unidades disponibles' : 'Sin resultados'}
            </div>
          ) : (
            filtered.map(u => (
              <button
                key={u.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:opacity-75 transition-opacity"
                style={{ borderBottom: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
                onClick={() => { onChange(u.id); setSearch(''); setShowDropdown(false) }}
              >
                <div className="text-sm">{u.name}</div>
                {(u.empresa_name || u.ruta_name) && (
                  <div className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
                    {[u.empresa_name, u.ruta_name].filter(Boolean).join(' · ')}
                  </div>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
