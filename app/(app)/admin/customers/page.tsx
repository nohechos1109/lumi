'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { notifyRefresh } from '@/lib/toast'
import { CustomerFormModal, type ContactSaved } from '@/app/(app)/customers/_components/CustomerFormModal'

type Contact = ContactSaved

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

export default function AdminCustomersPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [adding, setAdding] = useState(false)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'company' | 'person'>('all')
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const highlightRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId, contacts])

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/customers')
    setContacts(await r.json())
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = contacts.filter(c => {
    if (typeFilter !== 'all' && c.type !== typeFilter) return false
    const q = searchQuery.toLowerCase()
    if (!q) return true
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false) ||
      (c.phone?.toLowerCase().includes(q) ?? false) ||
      (c.tax_id?.toLowerCase().includes(q) ?? false) ||
      c.companies.some(co => co.name.toLowerCase().includes(q))
    )
  })

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
    if (res.ok) notifyRefresh()
    setDeleteId(null)
    load()
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin"
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
          style={{ color: 'var(--c-ghost)' }}
        >
          ← Volver al Dashboard Admin
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1
            className="font-heading text-3xl font-bold uppercase"
            style={{ color: 'var(--c-ink)', letterSpacing: '0.1em' }}
          >
            Contactos
          </h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'var(--c-ghost)' }}>
            {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="text-sm px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-opacity hover:opacity-85"
          style={{ background: 'var(--c-navy)', color: '#fff', letterSpacing: '0.08em' }}
        >
          + Nuevo Contacto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div style={{ maxWidth: '480px', flex: 1, minWidth: '200px' }}>
          <div
            className="flex items-center h-12 rounded-full transition-shadow"
            style={{
              background: 'var(--c-card)',
              border: searchQuery ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
              boxShadow: searchQuery
                ? '0 2px 8px rgba(27,52,97,0.12), 0 0 0 3px rgba(27,52,97,0.06)'
                : '0 1px 6px rgba(27,52,97,0.08)',
            }}
          >
            <div className="flex items-center justify-center w-12 shrink-0" style={{ color: searchQuery ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: searchQuery ? 0.85 : 0.5 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, email, RFC..."
              className="flex-1 h-full bg-transparent outline-none text-sm font-medium"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ color: 'var(--c-ink)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center justify-center w-10 h-10 mr-1 rounded-full transition-colors"
                style={{ color: 'var(--c-dim)' }}
                aria-label="Limpiar búsqueda"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Type filter */}
        <div className="flex rounded-xl overflow-hidden text-xs font-bold" style={{ border: '1px solid var(--c-rim)' }}>
          {(['all', 'company', 'person'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-4 py-2.5 transition-colors uppercase tracking-wider"
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

      {(searchQuery || typeFilter !== 'all') && (
        <div className="text-center text-xs font-mono mb-4" style={{ color: 'var(--c-ghost)' }}>
          {filtered.length} resultados
        </div>
      )}

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
              {['Tipo', 'Nombre', 'Detalle', 'Email', 'Teléfono', ''].map(h => (
                <th key={h} className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr
                key={c.id}
                ref={c.id === highlightId ? highlightRef : undefined}
                className="tr-hover transition-colors"
                style={{
                  borderTop: '1px solid var(--c-rim)',
                  background: c.id === highlightId ? 'var(--c-navy-bg)' : undefined,
                  outline: c.id === highlightId ? '2px solid var(--c-navy-bd)' : undefined,
                }}
              >
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
                          <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--c-panel)', color: 'var(--c-ghost)', border: '1px solid var(--c-rim)' }}>
                            {co.name}
                          </span>
                          {co.role && <span style={{ color: 'var(--c-ghost)' }}>{co.role}</span>}
                        </span>
                      ))}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4" style={{ color: c.email ? 'var(--c-ink)' : 'var(--c-ghost)' }}>
                  {c.email || '—'}
                </td>
                <td className="px-5 py-4" style={{ color: c.phone ? 'var(--c-ink)' : 'var(--c-ghost)' }}>
                  {c.phone || '—'}
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => setEditContact(c)}
                      className="text-xs font-semibold transition-opacity hover:opacity-70"
                      style={{ color: 'var(--c-navy)' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => setDeleteId(c.id)}
                      className="btn-delete text-xs"
                    >
                      Eliminar
                    </button>
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

      {adding && (
        <CustomerFormModal
          customer={null}
          onClose={() => setAdding(false)}
          onSaved={() => { setAdding(false); load() }}
        />
      )}

      {editContact && (
        <CustomerFormModal
          customer={editContact}
          onClose={() => setEditContact(null)}
          onSaved={() => { setEditContact(null); load() }}
        />
      )}

      {deleteId && (
        <ConfirmModal
          message="¿Eliminar este contacto? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
