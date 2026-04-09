'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'
import { notifyRefresh } from '@/lib/toast'

interface Customer { id: string; name: string; email: string | null; phone: string | null }

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')
  const highlightRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId, customers])

  async function load() {
    const r = await fetch('/api/admin/customers')
    setCustomers(await r.json())
  }

  useEffect(() => { load() }, [])

  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase()
    return c.name.toLowerCase().includes(q)
      || (c.email && c.email.toLowerCase().includes(q))
      || (c.phone && c.phone.toLowerCase().includes(q))
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: email || undefined, phone: phone || undefined }),
    })
    if (res.ok) notifyRefresh()
    setName(''); setEmail(''); setPhone(''); setAdding(false); load()
  }

  function openEdit(c: Customer) {
    setEditCustomer(c)
    setEditForm({ name: c.name, email: c.email || '', phone: c.phone || '' })
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editCustomer) return
    setEditSaving(true)
    const res = await fetch(`/api/admin/customers/${editCustomer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editForm.name, email: editForm.email || undefined, phone: editForm.phone || undefined }),
    })
    if (res.ok) notifyRefresh()
    setEditCustomer(null)
    setEditSaving(false)
    load()
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
    if (res.ok) notifyRefresh()
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
            Clientes
          </h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'var(--c-ghost)' }}>
            {customers.length} {customers.length === 1 ? 'cliente' : 'clientes'}
          </p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="text-sm px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-opacity hover:opacity-85"
          style={{
            background: 'var(--c-navy)',
            color: '#fff',
            letterSpacing: '0.08em',
          }}
        >
          + Nuevo Cliente
        </button>
      </div>

      {/* Modal editar cliente */}
      {editCustomer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(9,11,16,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditCustomer(null)}
        >
          <form
            onSubmit={handleEdit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5 shadow-xl"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--c-ink)' }}>Editar Cliente</h2>
              <button
                type="button"
                onClick={() => setEditCustomer(null)}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                style={{ color: 'var(--c-ghost)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-rim)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}>
                Nombre del cliente *
              </label>
              <input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Empresa S.A. de C.V."
                className="w-full px-3.5 py-2.5 rounded-lg outline-none text-sm transition-all"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}>
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                placeholder="contacto@empresa.com"
                className="w-full px-3.5 py-2.5 rounded-lg outline-none text-sm transition-all"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="(555) 123-4567"
                className="w-full px-3.5 py-2.5 rounded-lg outline-none text-sm transition-all"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditCustomer(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'var(--c-rim)', color: 'var(--c-dim)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={editSaving}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-90"
                style={{ background: 'var(--c-navy)', color: '#fff', letterSpacing: '0.08em', opacity: editSaving ? 0.6 : 1 }}
              >
                {editSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal crear cliente */}
      {adding && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(9,11,16,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={() => setAdding(false)}
        >
          <form
            onSubmit={handleAdd}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5 shadow-xl"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: 'var(--c-ink)' }}>Nuevo Cliente</h2>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                style={{ color: 'var(--c-ghost)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-rim)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}>
                Nombre del cliente *
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Empresa S.A. de C.V."
                className="w-full px-3.5 py-2.5 rounded-lg outline-none text-sm transition-all"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contacto@empresa.com"
                className="w-full px-3.5 py-2.5 rounded-lg outline-none text-sm transition-all"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}>
                Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full px-3.5 py-2.5 rounded-lg outline-none text-sm transition-all"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ background: 'var(--c-rim)', color: 'var(--c-dim)' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-90"
                style={{ background: 'var(--c-navy)', color: '#fff', letterSpacing: '0.08em' }}
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col gap-4 mb-6">
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
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
            <div className="flex items-center justify-center w-12 shrink-0" style={{ color: searchQuery ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: searchQuery ? 0.85 : 0.5, transition: 'color 0.2s, opacity 0.2s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              className="flex-1 h-full bg-transparent outline-none text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ color: 'var(--c-ink)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center justify-center w-10 h-10 mr-1 rounded-full transition-colors"
                style={{ color: 'var(--c-dim)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--c-rim)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                aria-label="Limpiar búsqueda"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        {searchQuery && (
          <div className="text-center text-xs font-mono" style={{ color: 'var(--c-ghost)' }}>
            {filteredCustomers.length} resultados
          </div>
        )}
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
                Nombre
              </th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
                Email
              </th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
                Teléfono
              </th>
              <th className="px-5 py-4 w-36"></th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(c => (
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
                <td className="px-5 py-4" style={{ color: 'var(--c-ink)' }}>{c.name}</td>
                <td className="px-5 py-4">
                  <span style={{ color: c.email ? 'var(--c-ink)' : 'var(--c-ghost)' }}>
                    {c.email || '—'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span style={{ color: c.phone ? 'var(--c-ink)' : 'var(--c-ghost)' }}>
                    {c.phone || '—'}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => openEdit(c)}
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
          </tbody>
        </table>
      </div>

      {deleteId && (
        <ConfirmModal
          message="¿Eliminar este cliente? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={() => { handleDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
