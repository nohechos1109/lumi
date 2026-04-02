'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

interface Customer { id: string; name: string }

const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }

export default function NewProjectPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)

    let customerId = form.get('customer_id') as string

    if (isNewCustomer) {
      if (!newCustomerName.trim()) { setLoading(false); return }
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName.trim() }),
      })
      if (!res.ok) { setLoading(false); return }
      const customer = await res.json()
      customerId = customer.id
    }

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        customer_id: customerId,
        status: 'draft',
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
              className="text-xs font-medium transition-colors"
              style={{ color: 'var(--c-navy)' }}
              onClick={() => { setIsNewCustomer(v => !v); setNewCustomerName('') }}
            >
              {isNewCustomer ? '← Seleccionar existente' : '+ Crear nuevo'}
            </button>
          </div>

          {isNewCustomer ? (
            <input
              type="text"
              required={isNewCustomer}
              placeholder="Nombre del cliente"
              value={newCustomerName}
              onChange={e => setNewCustomerName(e.target.value)}
              className="w-full"
              autoFocus
            />
          ) : (
            <select
              name="customer_id"
              required={!isNewCustomer}
              className="w-full"
            >
              <option value="">Seleccionar...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
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
    </div>
  )
}
