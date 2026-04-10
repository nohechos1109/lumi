'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { toast, notifyRefresh } from '@/lib/toast'
import { CustomerFormModal, type ContactSaved } from './CustomerFormModal'
import { canDeleteCustomers } from '@/lib/permissions'

type Contact = ContactSaved

// ─── DeleteRequestModal ────────────────────────────────────────────────────────

function DeleteRequestModal({ contact, onClose, onSent }: { contact: Contact; onClose: () => void; onSent: () => void }) {
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch(`/api/customers/${contact.id}/delete-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast(data.error ?? 'Error al enviar solicitud', 'error')
        return
      }
      notifyRefresh()
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
        role="dialog" aria-modal="true" aria-labelledby="delete-request-title"
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 8px 32px rgba(9,11,16,0.24)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col gap-1">
          <h2 id="delete-request-title" className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>
            Solicitar eliminación
          </h2>
          <p className="text-sm" style={{ color: 'var(--c-dim)' }}>
            Solicitarás eliminar a <span className="font-semibold" style={{ color: 'var(--c-ink)' }}>{contact.name}</span>. Un administrador revisará tu solicitud.
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
              placeholder="Explica por qué deseas eliminar este contacto…"
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-shadow"
              style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
              onFocus={e => { e.currentTarget.style.border = '1.5px solid var(--c-navy-bd)' }}
              onBlur={e => { e.currentTarget.style.border = '1px solid var(--c-rim)' }}
            />
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75" style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}>
              Cancelar
            </button>
            <button type="submit" disabled={sending} className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50" style={{ background: 'var(--c-rose)', color: '#FFFFFF' }}>
              {sending ? 'Enviando…' : 'Solicitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Type badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'company' | 'person' }) {
  const isCompany = type === 'company'
  return (
    <span
      className="inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium"
      style={{
        background: isCompany ? 'var(--c-navy-bg)' : 'rgba(139,92,246,0.08)',
        color: isCompany ? 'var(--c-navy)' : '#7c3aed',
        border: `1px solid ${isCompany ? 'var(--c-navy-bd)' : 'rgba(139,92,246,0.2)'}`,
      }}
    >
      {isCompany ? 'Empresa' : 'Persona'}
    </span>
  )
}

// ─── CustomersClient ───────────────────────────────────────────────────────────

interface Props {
  role: string
  initialCustomers: Contact[]
}

export default function CustomersClient({ role, initialCustomers }: Props) {
  const router = useRouter()
  const [contacts, setContacts] = useState<Contact[]>(initialCustomers)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'company' | 'person'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null)
  const [deleteRequest, setDeleteRequest] = useState<Contact | null>(null)

  const isSales = !canDeleteCustomers(role)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/customers')
      if (res.ok) {
        setContacts(await res.json())
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  const filtered = contacts.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    const q = search.toLowerCase()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.toLowerCase().includes(q) ?? false) ||
      (c.job_title?.toLowerCase().includes(q) ?? false) ||
      (c.tax_id?.toLowerCase().includes(q) ?? false) ||
      c.companies.some(co => co.name.toLowerCase().includes(q))
    )
  })

  async function handleDirectDelete(id: string) {
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      toast(data.error ?? 'Error al eliminar', 'error')
    } else {
      notifyRefresh()
      toast('Contacto eliminado', 'success')
    }
    setDeleteConfirm(null)
    await load()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)' }}>Contactos</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--c-navy)', color: '#FFFFFF' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Contacto
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1" style={{ minWidth: '220px', maxWidth: '420px' }}>
          <div
            className="flex items-center h-10 rounded-full"
            style={{
              background: 'var(--c-card)',
              border: search ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
              boxShadow: '0 1px 6px rgba(27,52,97,0.08)',
            }}
          >
            <div className="flex items-center justify-center w-10 shrink-0" style={{ color: search ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: search ? 0.85 : 0.5 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar contactos…"
              className="flex-1 h-full bg-transparent outline-none text-sm font-medium"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ color: 'var(--c-ink)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="flex items-center justify-center w-8 h-8 mr-1 rounded-full" style={{ color: 'var(--c-dim)' }} aria-label="Limpiar">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Type filter */}
        <div className="flex rounded-lg overflow-hidden text-xs font-semibold" style={{ border: '1px solid var(--c-rim)' }}>
          {(['all', 'company', 'person'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-3 py-2 transition-colors"
              style={{
                background: typeFilter === t ? 'var(--c-navy)' : 'var(--c-card)',
                color: typeFilter === t ? '#fff' : 'var(--c-dim)',
              }}
            >
              {t === 'all' ? 'Todos' : t === 'company' ? 'Empresas' : 'Personas'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--c-rim)', borderTopColor: 'var(--c-navy)' }} />
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-24 rounded-xl" style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}>
          <p className="text-base font-semibold" style={{ color: 'var(--c-dim)' }}>Sin contactos</p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--c-ghost)' }}>Crea tu primer contacto para comenzar.</p>
        </div>
      ) : (
        <>
          {(search || typeFilter !== 'all') && (
            <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>
              {filtered.length} de {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
            </p>
          )}
          <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', borderRadius: '16px' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}>
                    {['Tipo', 'Nombre', 'Detalle', 'Email', 'Teléfono', ''].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--c-rim)]">
                  {filtered.map(c => (
                    <tr key={c.id} className="tr-hover transition-colors">
                      <td className="px-5 py-4">
                        <TypeBadge type={c.type} />
                      </td>
                      <td className="px-5 py-4 font-semibold" style={{ color: 'var(--c-ink)' }}>
                        {c.name}
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: 'var(--c-dim)' }}>
                        {c.type === 'company' && c.tax_id && <span>{c.tax_id}</span>}
                        {c.type === 'person' && c.companies.length > 0 && (
                          <span className="flex flex-col gap-1">
                            {c.companies.map(co => (
                              <span key={co.id} className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--c-panel)', color: 'var(--c-ghost)', border: '1px solid var(--c-rim)' }}>
                                  {co.name}
                                </span>
                                {co.role && <span style={{ color: 'var(--c-ghost)' }}>{co.role}</span>}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }}>
                        {c.email ?? <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                      </td>
                      <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }}>
                        {c.phone ?? <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditContact(c)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                            style={{ background: 'var(--c-navy-bg)', color: 'var(--c-navy)', border: '1px solid var(--c-navy-bd)' }}
                          >
                            Editar
                          </button>
                          {isSales ? (
                            <button
                              onClick={() => setDeleteRequest(c)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                              style={{ background: 'var(--c-rose-bg)', color: 'var(--c-rose)', border: '1px solid rgba(209,44,60,0.18)' }}
                            >
                              Solicitar eliminación
                            </button>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(c)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-75"
                              style={{ background: 'var(--c-rose-bg)', color: 'var(--c-rose)', border: '1px solid rgba(209,44,60,0.18)' }}
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
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <p className="font-mono text-sm uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
                          No se encontraron contactos
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
          onSaved={async () => { setShowCreate(false); await load() }}
        />
      )}
      {editContact && (
        <CustomerFormModal
          customer={editContact}
          onClose={() => setEditContact(null)}
          onSaved={async () => { setEditContact(null); await load() }}
        />
      )}
      {deleteRequest && (
        <DeleteRequestModal
          contact={deleteRequest}
          onClose={() => setDeleteRequest(null)}
          onSent={() => setDeleteRequest(null)}
        />
      )}
      {deleteConfirm && (
        <ConfirmModal
          message={`¿Eliminar a "${deleteConfirm.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={() => handleDirectDelete(deleteConfirm.id)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  )
}
