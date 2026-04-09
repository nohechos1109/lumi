'use client'

import { useState, useEffect } from 'react'
import { toast } from '@/lib/toast'

export interface CustomerSaved {
  id: string
  name: string
  email: string | null
  phone: string | null
}

interface CustomerFormModalProps {
  customer: CustomerSaved | null // null = create, non-null = edit
  onClose: () => void
  onSaved: (customer: CustomerSaved) => void
}

export function CustomerFormModal({ customer, onClose, onSaved }: CustomerFormModalProps) {
  const isEdit = customer !== null
  const [name, setName] = useState(customer?.name ?? '')
  const [email, setEmail] = useState(customer?.email ?? '')
  const [phone, setPhone] = useState(customer?.phone ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = isEdit
        ? await fetch(`/api/customers/${customer.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null }),
          })
        : await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), email: email.trim() || null, phone: phone.trim() || null }),
          })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? 'Error al guardar', 'error')
        return
      }
      const saved: CustomerSaved = await res.json()
      toast(isEdit ? 'Cliente actualizado' : 'Cliente creado', 'success')
      onSaved(saved)
    } finally {
      setSaving(false)
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
        aria-labelledby="customer-form-title"
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2
          id="customer-form-title"
          className="text-base font-bold"
          style={{ color: 'var(--c-ink)' }}
        >
          {isEdit ? 'Editar cliente' : 'Nuevo cliente'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
              Nombre <span style={{ color: 'var(--c-rose)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre del cliente"
              required
              autoFocus
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-shadow"
              style={{
                background: 'var(--c-panel)',
                border: '1px solid var(--c-rim)',
                color: 'var(--c-ink)',
              }}
              onFocus={e => { e.currentTarget.style.border = '1.5px solid var(--c-navy-bd)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid var(--c-rim)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-shadow"
              style={{
                background: 'var(--c-panel)',
                border: '1px solid var(--c-rim)',
                color: 'var(--c-ink)',
              }}
              onFocus={e => { e.currentTarget.style.border = '1.5px solid var(--c-navy-bd)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid var(--c-rim)' }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
              Teléfono
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+52 55 0000 0000"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-shadow"
              style={{
                background: 'var(--c-panel)',
                border: '1px solid var(--c-rim)',
                color: 'var(--c-ink)',
              }}
              onFocus={e => { e.currentTarget.style.border = '1.5px solid var(--c-navy-bd)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid var(--c-rim)' }}
            />
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
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
              disabled={saving || !name.trim()}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{
                background: 'var(--c-navy)',
                color: '#FFFFFF',
              }}
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
