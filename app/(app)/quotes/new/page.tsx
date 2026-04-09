'use client'

import { useState, useEffect, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Customer { id: string; name: string; email: string | null; phone: string | null }

const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }

export default function NewQuotePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <NewQuoteForm />
    </Suspense>
  )
}

function NewQuoteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [isNewCustomer, setIsNewCustomer] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState('')
  const [newCustomerEmail, setNewCustomerEmail] = useState('')
  const [newCustomerPhone, setNewCustomerPhone] = useState('')
  const [today, setToday] = useState('')

  useEffect(() => {
    setToday(new Date().toISOString().split('T')[0])
  }, [])
  
  const initialCustomerId = searchParams.get('customer_id') || ''
  const initialProjectId = searchParams.get('project_id') || ''

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
        body: JSON.stringify({
          name: newCustomerName.trim(),
          email: newCustomerEmail.trim() || undefined,
          phone: newCustomerPhone.trim() || undefined,
        }),
      })
      if (!res.ok) { setLoading(false); return }
      const customer = await res.json()
      customerId = customer.id
    }

    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: form.get('description'),
        customer_id: customerId,
        unit_count: Number(form.get('unit_count')),
        payment_term_id: form.get('payment_term_id') || null,
        quotation_date: new Date().toISOString(),
        expiration_date: form.get('expiration_date') || null,
        project_id: initialProjectId || null,
      }),
    })

    const result = await res.json()
    setLoading(false)

    if (!res.ok) {
      alert('Error: ' + (result.error || 'Failed to create quote'))
      return
    }

    router.push(`/quotes/${result.id}`)
  }

  return (
    <div className="max-w-lg">
      <div className="mb-8">
        <h1
          className="font-heading text-3xl font-bold"
          style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
        >
          Nueva Cotización
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          Completa los datos para crear una nueva cotización.
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

        <div className="grid grid-cols-2 gap-4">
          {/* ── Cliente ─────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls} style={{ ...labelStyle, marginBottom: 0 }}>
                Cliente *
              </label>
              {!initialCustomerId && (
                <button
                  type="button"
                  className="text-xs font-medium transition-colors"
                  style={{ color: 'var(--c-navy)' }}
                  onClick={() => { setIsNewCustomer(v => !v); setNewCustomerName(''); setNewCustomerEmail(''); setNewCustomerPhone('') }}
                >
                  {isNewCustomer ? '← Seleccionar existente' : '+ Crear nuevo'}
                </button>
              )}
            </div>

            {isNewCustomer ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  required={isNewCustomer}
                  placeholder="Nombre del cliente"
                  value={newCustomerName}
                  onChange={e => setNewCustomerName(e.target.value)}
                  className="w-full"
                  autoFocus
                />
                <input
                  type="email"
                  placeholder="Email (opcional)"
                  value={newCustomerEmail}
                  onChange={e => setNewCustomerEmail(e.target.value)}
                  className="w-full"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={newCustomerPhone}
                  onChange={e => setNewCustomerPhone(e.target.value)}
                  className="w-full"
                />
              </div>
            ) : (
              <select
                name="customer_id"
                required={!isNewCustomer}
                className="w-full disabled:bg-slate-50 disabled:text-slate-500"
                value={initialCustomerId || undefined}
                disabled={!!initialCustomerId}
              >
                <option value="">Seleccionar...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {initialCustomerId && (
              <input type="hidden" name="customer_id" value={initialCustomerId} />
            )}
          </div>

          {/* ── Unidades ────────────────────────────── */}
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
            {loading ? 'Creando...' : 'Crear Cotización'}
          </button>
        </div>
      </form>
    </div>
  )
}
