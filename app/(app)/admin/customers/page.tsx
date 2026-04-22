'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import CustomerDeleteModal, { type ContactDeps } from '@/components/ui/CustomerDeleteModal'
import { toast, notifyRefresh } from '@/lib/toast'
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
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null)
  const [deleteDeps, setDeleteDeps] = useState<ContactDeps | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'company' | 'person'>('all')
  const [showArchived, setShowArchived] = useState(false)
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const highlightRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId, contacts])

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/customers${showArchived ? '?includeArchived=true' : ''}`)
    setContacts(await r.json())
  }, [showArchived])

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

  async function openDelete(contact: Contact) {
    setDeleteTarget(contact)
    setDeleteDeps(null)
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/customers/${contact.id}/dependencies`)
      if (!res.ok) throw new Error('deps fetch failed')
      setDeleteDeps(await res.json())
    } catch {
      toast('No se pudieron obtener las dependencias', 'error')
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  function closeDelete() {
    setDeleteTarget(null)
    setDeleteDeps(null)
  }

  async function runContactAction(url: string, method: 'POST' | 'DELETE', okMsg: string, errMsg: string, close = true) {
    const res = await fetch(url, { method })
    if (res.ok) { toast(okMsg); notifyRefresh() }
    else toast(errMsg, 'error')
    if (close) closeDelete()
    load()
  }

  async function doDeleteSimple() {
    if (!deleteTarget) return
    await runContactAction(`/api/admin/customers/${deleteTarget.id}`, 'DELETE', 'Contacto eliminado', 'No se pudo eliminar')
  }

  async function doDeleteCascade() {
    if (!deleteTarget) return
    await runContactAction(`/api/admin/customers/${deleteTarget.id}?force=true`, 'DELETE', 'Contacto y registros asociados eliminados', 'No se pudo eliminar')
  }

  async function doArchive() {
    if (!deleteTarget) return
    await runContactAction(`/api/admin/customers/${deleteTarget.id}/archive`, 'POST', 'Contacto archivado', 'No se pudo archivar')
  }

  async function doUnarchive(id: string) {
    await runContactAction(`/api/admin/customers/${id}/archive`, 'DELETE', 'Contacto restaurado', 'No se pudo restaurar', false)
  }

  return (
    <div>
      <div className="mb-5">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
          style={{ color: 'var(--c-ghost)' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Dashboard Admin
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)' }}>Admin</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)' }}>Contactos</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
            {contacts.length} {contacts.length === 1 ? 'contacto' : 'contactos'}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--c-navy)', color: '#fff' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Contacto
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
        <div className="flex rounded-xl overflow-hidden text-xs font-semibold" style={{ border: '1px solid var(--c-rim)' }}>
          {(['all', 'company', 'person'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-4 py-2.5 transition-colors"
              style={{
                background: typeFilter === t ? 'var(--c-navy)' : 'var(--c-card)',
                color: typeFilter === t ? '#fff' : 'var(--c-dim)',
              }}
            >
              {t === 'all' ? 'Todos' : t === 'company' ? 'Empresas' : 'Personas'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowArchived(v => !v)}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors"
          style={{
            background: showArchived ? 'var(--c-navy)' : 'var(--c-card)',
            color: showArchived ? '#fff' : 'var(--c-dim)',
            border: '1px solid var(--c-rim)',
          }}
        >
          {showArchived ? 'Ocultar archivados' : 'Mostrar archivados'}
        </button>
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
                <td className="px-5 py-4 font-semibold" style={{ color: c.archived_at ? 'var(--c-ghost)' : 'var(--c-ink)' }}>
                  {c.name}
                  {c.archived_at && (
                    <span className="ml-2 inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-widest" style={{ background: 'var(--c-panel)', color: 'var(--c-ghost)', border: '1px solid var(--c-rim)' }}>
                      Archivado
                    </span>
                  )}
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
                    {c.archived_at ? (
                      <button
                        onClick={() => doUnarchive(c.id)}
                        className="text-xs font-semibold transition-opacity hover:opacity-70"
                        style={{ color: 'var(--c-navy)' }}
                      >
                        Restaurar
                      </button>
                    ) : (
                      <button
                        onClick={() => openDelete(c)}
                        className="btn-delete text-xs"
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

      {deleteTarget && (
        <CustomerDeleteModal
          contactName={deleteTarget.name}
          deps={deleteDeps}
          loading={deleteLoading}
          onCancel={closeDelete}
          onArchive={doArchive}
          onDeleteSimple={doDeleteSimple}
          onDeleteCascade={doDeleteCascade}
        />
      )}
    </div>
  )
}
