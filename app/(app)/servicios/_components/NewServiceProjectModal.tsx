'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import CustomerSearchSelect from '@/components/ui/CustomerSearchSelect'
import { notifyRefresh, toast } from '@/lib/toast'

interface Customer {
  id: string
  name: string
  companies: { id: string; name: string }[]
}

interface Props {
  onClose: () => void
}

const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }
const inp = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }

export default function NewServiceProjectModal({ onClose }: Props) {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers).catch(() => {})
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/servicios/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          customer_id: customerId || null,
          observaciones: form.get('observaciones') || null,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast(result.error || 'Error al crear el proyecto', 'error')
        return
      }
      toast('Proyecto creado', 'success')
      notifyRefresh()
      onClose()
      router.push(`/servicios/projects/${result.id}`)
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
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--c-rim)' }}>
          <div>
            <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--c-ink)', letterSpacing: '0.03em' }}>
              Nuevo Proyecto de Servicios
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
              Agrupa órdenes y servicios bajo un proyecto.
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

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
          <div>
            <label className={labelCls} style={labelStyle}>Nombre del Proyecto *</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Ej. Servicios TVJ — Flotilla 2026"
              className="w-full text-sm rounded-xl px-4 py-2.5"
              style={inp}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Cliente (opcional)</label>
            <CustomerSearchSelect
              customers={customers}
              value={customerId}
              onChange={setCustomerId}
            />
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Observaciones (opcional)</label>
            <textarea
              name="observaciones"
              rows={3}
              placeholder="Notas adicionales..."
              className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
              style={inp}
            />
          </div>

          <div className="flex gap-3" style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-75"
              style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all text-white"
              style={{
                background: loading ? 'var(--c-rim-hi)' : 'var(--c-navy)',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Creando...' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
