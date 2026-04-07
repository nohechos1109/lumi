'use client'

import { useState, useEffect, useCallback } from 'react'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast } from '@/lib/toast'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
}

// ─── CustomerFormModal ────────────────────────────────────────────────────────

interface CustomerFormModalProps {
  customer: Customer | null // null = create, non-null = edit
  onClose: () => void
  onSaved: () => void
}

function CustomerFormModal({ customer, onClose, onSaved }: CustomerFormModalProps) {
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
      toast(isEdit ? 'Cliente actualizado' : 'Cliente creado', 'success')
      onSaved()
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

// ─── DeleteRequestModal ────────────────────────────────────────────────────────

interface DeleteRequestModalProps {
  customer: Customer
  onClose: () => void
  onSent: () => void
}

function DeleteRequestModal({ customer, onClose, onSent }: DeleteRequestModalProps) {
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch(`/api/customers/${customer.id}/delete-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? 'Error al enviar solicitud', 'error')
        return
      }
      toast('Solicitud de eliminación enviada', 'success')
      onSent()
    } finally {
      setSending(false)
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
        aria-labelledby="delete-request-title"
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h2
            id="delete-request-title"
            className="text-base font-bold"
            style={{ color: 'var(--c-ink)' }}
          >
            Solicitar eliminación
          </h2>
          <p className="text-sm" style={{ color: 'var(--c-dim)' }}>
            Solicitarás eliminar a <span className="font-semibold" style={{ color: 'var(--c-ink)' }}>{customer.name}</span>. Un administrador revisará tu solicitud.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
              Razón (opcional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explica por qué deseas eliminar este cliente…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-shadow"
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
              disabled={sending}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{
                background: 'var(--c-rose)',
                color: '#FFFFFF',
              }}
            >
              {sending ? 'Enviando…' : 'Solicitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── CustomersClient ───────────────────────────────────────────────────────────

interface Props {
  role: string
}

export default function CustomersClient({ role }: Props) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [deleteConfirmCustomer, setDeleteConfirmCustomer] = useState<Customer | null>(null)
  const [deleteRequestCustomer, setDeleteRequestCustomer] = useState<Customer | null>(null)

  const isSales = role === 'sales'

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        const data = await res.json()
        setCustomers(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.toLowerCase().includes(q) ?? false)
    )
  })

  async function handleDirectDelete(id: string) {
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast(data.error ?? 'Error al eliminar', 'error')
    } else {
      toast('Cliente eliminado', 'success')
    }
    setDeleteConfirmCustomer(null)
    await loadCustomers()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)' }}>
          Clientes
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--c-navy)', color: '#FFFFFF' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Cliente
        </button>
      </div>

      {/* Search */}
      <div
        className="relative"
        style={{ maxWidth: '480px' }}
      >
        <div
          className="flex items-center h-10 rounded-full"
          style={{
            background: 'var(--c-card)',
            border: search ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
            boxShadow: '0 1px 6px rgba(27,52,97,0.08)',
          }}
        >
          <div
            className="flex items-center justify-center w-10 shrink-0"
            style={{ color: search ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: search ? 0.85 : 0.5 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono…"
            className="flex-1 h-full bg-transparent outline-none text-sm font-medium"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ color: 'var(--c-ink)' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="flex items-center justify-center w-8 h-8 mr-1 rounded-full"
              style={{ color: 'var(--c-dim)' }}
              aria-label="Limpiar búsqueda"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="w-8 h-8 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--c-rim)', borderTopColor: 'var(--c-navy)' }}
          />
        </div>
      ) : customers.length === 0 ? (
        <div
          className="text-center py-24 rounded-xl"
          style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}
        >
          <p className="text-base font-semibold" style={{ color: 'var(--c-dim)' }}>
            Sin clientes
          </p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--c-ghost)' }}>
            Crea tu primer cliente para comenzar.
          </p>
        </div>
      ) : (
        <>
          {search && (
            <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>
              {filtered.length} de {customers.length} {customers.length === 1 ? 'cliente' : 'clientes'}
            </p>
          )}
          <div
            className="rounded-xl overflow-hidden shadow-sm"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', borderRadius: '16px' }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}>
                    <th
                      className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}
                    >
                      Nombre
                    </th>
                    <th
                      className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}
                    >
                      Email
                    </th>
                    <th
                      className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest"
                      style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}
                    >
                      Teléfono
                    </th>
                    <th className="px-5 py-4 w-40" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--c-rim)]">
                  {filtered.map(c => (
                    <tr key={c.id} className="tr-hover transition-colors">
                      <td className="px-5 py-4 font-semibold text-sm" style={{ color: 'var(--c-ink)' }}>
                        {c.name}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--c-dim)' }}>
                        {c.email ?? <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                      </td>
                      <td className="px-5 py-4 text-sm" style={{ color: 'var(--c-dim)' }}>
                        {c.phone ?? <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditCustomer(c)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                            style={{
                              background: 'var(--c-navy-bg)',
                              color: 'var(--c-navy)',
                              border: '1px solid var(--c-navy-bd)',
                            }}
                          >
                            Editar
                          </button>
                          {isSales ? (
                            <button
                              onClick={() => setDeleteRequestCustomer(c)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                              style={{
                                background: 'var(--c-rose-bg)',
                                color: 'var(--c-rose)',
                                border: '1px solid rgba(209,44,60,0.18)',
                              }}
                            >
                              Solicitar eliminación
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmCustomer(c)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                              style={{
                                background: 'var(--c-rose-bg)',
                                color: 'var(--c-rose)',
                                border: '1px solid rgba(209,44,60,0.18)',
                              }}
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center">
                        <p
                          className="font-mono text-sm uppercase tracking-widest"
                          style={{ color: 'var(--c-ghost)' }}
                        >
                          No se encontraron clientes
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      {showCreate && (
        <CustomerFormModal
          customer={null}
          onClose={() => setShowCreate(false)}
          onSaved={async () => {
            setShowCreate(false)
            await loadCustomers()
          }}
        />
      )}

      {editCustomer && (
        <CustomerFormModal
          customer={editCustomer}
          onClose={() => setEditCustomer(null)}
          onSaved={async () => {
            setEditCustomer(null)
            await loadCustomers()
          }}
        />
      )}

      {deleteRequestCustomer && (
        <DeleteRequestModal
          customer={deleteRequestCustomer}
          onClose={() => setDeleteRequestCustomer(null)}
          onSent={() => {
            setDeleteRequestCustomer(null)
          }}
        />
      )}

      {deleteConfirmCustomer && (
        <ConfirmModal
          message={`¿Eliminar al cliente "${deleteConfirmCustomer.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => handleDirectDelete(deleteConfirmCustomer.id)}
          onCancel={() => setDeleteConfirmCustomer(null)}
        />
      )}
    </div>
  )
}
