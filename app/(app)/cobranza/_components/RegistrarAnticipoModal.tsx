'use client'

import { useState, useMemo } from 'react'

import { PAYMENT_METHODS } from '@/lib/constants/payments'

interface SaleOption {
  id: string
  number: string
  customer_name: string
}

interface Props {
  sales: SaleOption[]
  onClose: () => void
  onCreated: () => void
}

const inputStyle: React.CSSProperties = {
  background: 'var(--c-rim)',
  border: '1px solid var(--c-rim)',
  color: 'var(--c-ink)',
  outline: 'none',
}

export default function RegistrarAnticipoModal({ sales, onClose, onCreated }: Props) {
  const [search,   setSearch]   = useState('')
  const [saleId,   setSaleId]   = useState('')
  const [amount,   setAmount]   = useState('')
  const [method,   setMethod]   = useState('transferencia')
  const [date,     setDate]     = useState(() => new Date().toISOString().slice(0, 10))
  const [concept,  setConcept]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search) return sales
    const q = search.toLowerCase()
    return sales.filter(s =>
      s.number.toLowerCase().includes(q) ||
      s.customer_name.toLowerCase().includes(q)
    )
  }, [sales, search])

  const selectedSale = sales.find(s => s.id === saleId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const n = parseFloat(amount)
    if (!saleId)     { setError('Selecciona una venta'); return }
    if (!n || n <= 0) { setError('Ingresa un monto válido'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/cobranza/anticipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sale_id:        saleId,
          amount:         n,
          payment_method: method,
          payment_date:   date,
          concept:        concept || null,
        }),
      })
      if (res.ok) {
        onCreated()
        onClose()
      } else {
        const d = await res.json()
        setError(d.error ?? 'Error al registrar anticipo')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 flex flex-col"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(27,52,97,0.18)',
          maxHeight: '90vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Registrar Anticipo</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
              Pago recibido antes de emitir notas
            </p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto">

          {/* Sale selector */}
          {!selectedSale ? (
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>
                VENTA
              </label>
              <div className="relative mb-2">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="12" height="12"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  style={{ color: 'var(--c-ghost)' }}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  autoFocus
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por número o cliente..."
                  className="w-full rounded-lg pl-8 pr-3 py-2 text-xs"
                  style={inputStyle}
                />
              </div>
              <div className="rounded-lg overflow-y-auto max-h-40" style={{ border: '1px solid var(--c-rim)' }}>
                {filtered.length === 0 ? (
                  <p className="text-center text-xs py-6" style={{ color: 'var(--c-ghost)' }}>
                    {sales.length === 0 ? 'No hay ventas activas' : 'Sin resultados'}
                  </p>
                ) : filtered.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSaleId(s.id)}
                    className="w-full text-left px-3 py-2 hover:opacity-75 transition-opacity"
                    style={{ borderBottom: '1px solid var(--c-rim)' }}
                  >
                    <p className="font-mono text-xs font-semibold" style={{ color: 'var(--c-navy)' }}>{s.number}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--c-ink)' }}>{s.customer_name}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg px-4 py-2.5 flex items-center justify-between"
              style={{ background: 'var(--c-rim)' }}>
              <div>
                <p className="text-xs font-semibold font-mono" style={{ color: 'var(--c-navy)' }}>
                  {selectedSale.number}
                </p>
                <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>{selectedSale.customer_name}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSaleId(''); setSearch('') }}
                className="text-xs hover:opacity-70"
                style={{ color: 'var(--c-ghost)' }}
              >
                Cambiar
              </button>
            </div>
          )}

          {/* Amount + method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>MONTO</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>FECHA</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={inputStyle}
              />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>MÉTODO</label>
              <select
                value={method}
                onChange={e => setMethod(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={inputStyle}
              >
                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--c-ghost)' }}>CONCEPTO (opcional)</label>
              <input
                type="text"
                value={concept}
                onChange={e => setConcept(e.target.value)}
                placeholder="Anticipo inicial..."
                className="w-full rounded-lg px-3 py-2 text-sm"
                style={inputStyle}
              />
            </div>
          </div>

          {error && <p className="text-xs" style={{ color: '#BE123C' }}>{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
              style={{ background: 'var(--c-rim)', color: 'var(--c-ink)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !saleId}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
              style={{ background: 'var(--c-navy)', color: '#fff' }}
            >
              {loading ? 'Guardando…' : 'Registrar Anticipo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
