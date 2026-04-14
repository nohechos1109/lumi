'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerFormModal, CustomerSaved } from '@/app/(app)/customers/_components/CustomerFormModal'
import CustomerSearchSelect from '@/components/ui/CustomerSearchSelect'
import { notifyRefresh, toast } from '@/lib/toast'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  companies: { id: string; name: string }[]
}

interface Props {
  onClose: () => void
  projectId?: string
  customerId?: string
  customerName?: string
}

const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }

export default function NewQuoteModal({ onClose, projectId, customerId, customerName }: Props) {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>(
    customerId && customerName
      ? [{ id: customerId, name: customerName, email: null, phone: null, companies: [] }]
      : []
  )
  const [loading, setLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerId ?? '')
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0])
    if (!customerId) {
      fetch('/api/customers').then(r => r.json()).then(setCustomers).catch(() => {})
    }
  }, [customerId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !showNewCustomerModal) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, showNewCustomerModal])

  function handleCustomerSaved(customer: CustomerSaved) {
    setCustomers(prev => [...prev, customer])
    setSelectedCustomerId(customer.id)
    setShowNewCustomerModal(false)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedCustomerId) return
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.get('description'),
          customer_id: selectedCustomerId,
          unit_count: Number(form.get('unit_count')),
          quotation_date: new Date().toISOString(),
          expiration_date: form.get('expiration_date') || null,
          project_id: projectId ?? null,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast(result.error || 'Error al crear la cotización', 'error')
        return
      }
      notifyRefresh()
      onClose()
      router.push(`/quotes/${result.id}`)
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
        aria-labelledby="new-quote-title"
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
              id="new-quote-title"
              className="font-heading text-xl font-bold"
              style={{ color: 'var(--c-ink)', letterSpacing: '0.03em' }}
            >
              Nueva Cotización
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
              Completa los datos para crear una venta de mostrador.
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
              Requerimiento de la cotización *
            </label>
            <input
              name="description"
              type="text"
              required
              placeholder="Ej. Requerimiento de la cotización..."
              className="w-full"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls} style={{ ...labelStyle, marginBottom: 0 }}>
                Cliente *
              </label>
              {!customerId && (
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-md px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-85"
                  style={{ backgroundColor: 'var(--c-navy)', cursor: 'pointer' }}
                  onClick={() => setShowNewCustomerModal(true)}
                >
                  + Nuevo cliente
                </button>
              )}
            </div>
            <CustomerSearchSelect
              customers={customers}
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              disabled={!!customerId}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Vehículos (unidades) *</label>
            <input
              name="unit_count"
              type="number"
              min="1"
              step="1"
              defaultValue="1"
              required
              className="w-full"
              onBlur={e => {
                const v = Math.floor(Math.max(1, Number(e.target.value)))
                e.target.value = String(v)
              }}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Fecha de expiración</label>
            <input
              name="expiration_date"
              type="date"
              min={today}
              className="w-full"
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
                background: loading || !selectedCustomerId ? 'var(--c-rim-hi)' : '#0B9962',
                color: loading || !selectedCustomerId ? 'var(--c-dim)' : '#FFFFFF',
                cursor: loading || !selectedCustomerId ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Creando...' : 'Crear Cotización'}
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
