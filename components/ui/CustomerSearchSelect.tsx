'use client'

import { useState, useMemo } from 'react'

export interface CustomerOption {
  id: string
  name: string
  companies: { id: string; name: string }[]
}

interface Props {
  customers: CustomerOption[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
}

export default function CustomerSearchSelect({ customers, value, onChange, disabled }: Props) {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const selected = customers.find(c => c.id === value)

  const filtered = useMemo(() => {
    if (!search) return customers.slice(0, 10)
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.companies.some(co => co.name.toLowerCase().includes(q))
    ).slice(0, 10)
  }, [customers, search])

  if (selected) {
    return (
      <div className="flex items-start justify-between rounded-lg px-3 py-2"
        style={{ background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
        <div>
          <div className="text-sm font-medium" style={{ color: '#1D4ED8' }}>{selected.name}</div>
          {selected.companies.length > 0 && (
            <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              {selected.companies.map(co => co.name).join(', ')}
            </div>
          )}
        </div>
        {!disabled && (
          <button type="button" onClick={() => onChange('')}
            className="text-xs hover:opacity-70 ml-2 mt-0.5 flex-shrink-0" style={{ color: '#6B7280' }}>✕</button>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Buscar cliente..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        className="w-full"
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute z-10 w-full mt-1 rounded-lg overflow-y-auto"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxHeight: '260px' }}>
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left px-3 py-2 hover:opacity-75 transition-opacity"
              style={{ borderBottom: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
              onClick={() => { onChange(c.id); setSearch(''); setShowDropdown(false) }}>
              <div className="text-sm">{c.name}</div>
              {c.companies.length > 0 && (
                <div className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
                  {c.companies.map(co => co.name).join(', ')}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
