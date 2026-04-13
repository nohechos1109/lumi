'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerFormModal, CustomerSaved } from '@/app/(app)/customers/_components/CustomerFormModal'
import CustomerSearchSelect from '@/components/ui/CustomerSearchSelect'
import { notifyRefresh } from '@/lib/toast'

interface Customer {
  id: string
  name: string
  companies: { id: string; name: string }[]
}

const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }

export default function NewProjectPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false)

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  function handleCustomerSaved(customer: CustomerSaved) {
    setCustomers(prev => [...prev, { id: customer.id, name: customer.name, companies: [] }])
    setSelectedCustomerId(customer.id)
    setShowNewCustomerModal(false)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        customer_id: selectedCustomerId,
        status: 'follow_up',
        date: new Date().toISOString().split('T')[0],
        description: form.get('description'),
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!res.ok) {
      alert('Error: ' + (result.error || 'Failed to create project'))
      return
    }

    notifyRefresh()
    router.push(`/projects/${result.id}`)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1
          className="font-heading text-3xl font-bold"
          style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
        >
          Nuevo Proyecto
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          Crea un nuevo proyecto para agrupar tus cotizaciones.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl flex flex-col gap-5 p-6"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 1px 4px rgba(27,52,97,0.06)',
        }}
      >
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
              style={{ 
                backgroundColor: 'var(--c-navy)',
                cursor: 'pointer',
               }}
              onClick={() => setShowNewCustomerModal(true)}
            >
              + Nuevo cliente
            </button>
          </div>

          <CustomerSearchSelect
            customers={customers}
            value={selectedCustomerId}
            onChange={setSelectedCustomerId}
          />
        </div>

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

        <div
          className="flex gap-3"
          style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1.25rem' }}
        >
          <button
            type="button"
            onClick={() => router.back()}
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
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: loading ? 'var(--c-rim-hi)' : 'var(--c-navy)',
              color: loading ? 'var(--c-dim)' : '#FFFFFF',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? 'Creando...' : 'Crear Proyecto'}
          </button>
        </div>
      </form>

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
