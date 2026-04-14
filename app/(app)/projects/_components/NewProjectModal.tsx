'use client'

import { useState, useEffect, useMemo, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerFormModal, CustomerSaved } from '@/app/(app)/customers/_components/CustomerFormModal'
import CustomerSearchSelect from '@/components/ui/CustomerSearchSelect'
import { notifyRefresh, toast } from '@/lib/toast'

interface Customer {
  id: string
  name: string
  companies: { id: string; name: string }[]
}

interface Ruta {
  id: string
  name: string
  cliente_id: string | null
}

interface Props {
  onClose: () => void
}

const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }
const inp = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }

export default function NewProjectModal({ onClose }: Props) {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedRutaId, setSelectedRutaId] = useState('')
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers).catch(() => {})
    fetch('/api/rutas').then(r => r.json()).then(setRutas).catch(() => {})
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !showNewCustomerModal) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, showNewCustomerModal])

  const availableRutas = useMemo(() => {
    if (!selectedCustomerId) return []
    const customer = customers.find(c => c.id === selectedCustomerId)
    if (!customer) return []
    const relatedIds = new Set([selectedCustomerId, ...customer.companies.map(co => co.id)])
    return rutas.filter(r => r.cliente_id && relatedIds.has(r.cliente_id))
  }, [selectedCustomerId, customers, rutas])

  function handleCustomerChange(id: string) {
    setSelectedCustomerId(id)
    setSelectedRutaId('')
  }

  function handleCustomerSaved(customer: CustomerSaved) {
    setCustomers(prev => [...prev, { id: customer.id, name: customer.name, companies: [] }])
    setSelectedCustomerId(customer.id)
    setShowNewCustomerModal(false)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedCustomerId) return
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          customer_id: selectedCustomerId,
          status: 'follow_up',
          date: new Date().toISOString().split('T')[0],
          description: form.get('description'),
          ruta_id: selectedRutaId || null,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast(result.error || 'Error al crear el proyecto', 'error')
        return
      }
      notifyRefresh()
      onClose()
      router.push(`/projects/${result.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
        className="w-full max-w-lg rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--c-rim)' }}
        >
          <div>
            <h2
              id="new-project-title"
              className="font-heading text-xl font-bold"
              style={{ color: 'var(--c-ink)', letterSpacing: '0.03em' }}
            >
              Nuevo Proyecto
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
              Crea un nuevo proyecto para agrupar tus cotizaciones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:opacity-70"
            style={{ color: 'var(--c-dim)', cursor: 'pointer', background: 'transparent', border: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
          <div>
            <label className={labelCls} style={labelStyle}>
              Nombre del Proyecto *
            </label>
            <input
              name="name"
              type="text"
              required
              placeholder="Ej. Proyecto de Cámaras - TVJ 2026"
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls} style={{ ...labelStyle, marginBottom: 0 }}>
                Cliente *
              </label>
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-85"
                style={{ backgroundColor: 'var(--c-navy)', cursor: 'pointer' }}
                onClick={() => setShowNewCustomerModal(true)}
              >
                + Nuevo cliente
              </button>
            </div>
            <CustomerSearchSelect
              customers={customers}
              value={selectedCustomerId}
              onChange={handleCustomerChange}
            />
          </div>

          {selectedCustomerId && (
            <div>
              <label className={labelCls} style={labelStyle}>
                Ruta {availableRutas.length === 0 ? '(sin rutas disponibles para este cliente)' : '(opcional)'}
              </label>
              {availableRutas.length > 0 && (
                <select
                  className="w-full text-sm rounded-xl px-4 py-2.5"
                  style={inp}
                  value={selectedRutaId}
                  onChange={e => setSelectedRutaId(e.target.value)}
                >
                  <option value="">Sin ruta</option>
                  {availableRutas.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label className={labelCls} style={labelStyle}>
              Descripción (opcional)
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Notas adicionales sobre el proyecto..."
              className="w-full resize-none"
            />
          </div>

          {/* Footer */}
          <div
            className="flex gap-3"
            style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1.25rem' }}
          >
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-75"
              style={{
                background: 'transparent',
                color: 'var(--c-dim)',
                border: '1px solid var(--c-rim)',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedCustomerId}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: loading || !selectedCustomerId ? 'var(--c-rim-hi)' : 'var(--c-navy)',
                color: loading || !selectedCustomerId ? 'var(--c-dim)' : '#FFFFFF',
                cursor: loading || !selectedCustomerId ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>

      {showNewCustomerModal && (
        <CustomerFormModal
          customer={null}
          onClose={() => setShowNewCustomerModal(false)}
          onSaved={handleCustomerSaved}
        />
      )}
    </div>
  )
}
