'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Customer { id: string; name: string; email: string | null; phone: string | null }

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
    await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email: email || undefined, phone: phone || undefined }),
    })
    setName(''); setEmail(''); setPhone(''); setAdding(false); load()
  }

  function startEdit(c: Customer) {
    setEditingId(c.id)
    setEditName(c.name)
    setEditEmail(c.email || '')
    setEditPhone(c.phone || '')
  }

  async function saveEdit() {
    if (!editingId) return
    await fetch(`/api/admin/customers/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, email: editEmail || undefined, phone: editPhone || undefined }),
    })
    setEditingId(null)
    setEditName('')
    setEditEmail('')
    setEditPhone('')
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' })
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
          onClick={() => setAdding(v => !v)}
          className="text-sm px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-opacity hover:opacity-85"
          style={{
            background: adding ? 'var(--c-rim-hi)' : 'var(--c-navy)',
            color: adding ? 'var(--c-dim)' : '#fff',
            letterSpacing: '0.08em',
          }}
        >
          {adding ? 'Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl p-5 mb-5"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim-hi)' }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}
              >
                Nombre del cliente *
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full"
                style={{ background: 'var(--c-panel)' }}
                placeholder="Empresa S.A. de C.V."
              />
            </div>
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full"
                style={{ background: 'var(--c-panel)' }}
                placeholder="contacto@empresa.com"
              />
            </div>
            <div>
              <label
                className="block text-xs font-bold uppercase tracking-widest mb-2"
                style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}
              >
                Teléfono
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full"
                style={{ background: 'var(--c-panel)' }}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-wider"
              style={{ background: 'var(--c-navy)', color: '#fff' }}
            >
              Guardar
            </button>
          </div>
        </form>
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
                onClick={() => { if (editingId !== c.id) startEdit(c) }}
                className={editingId === c.id ? '' : 'tr-hover cursor-pointer'}
                style={{
                  borderTop: '1px solid var(--c-rim)',
                  background: editingId === c.id ? 'var(--c-hover)' : undefined,
                }}
              >
                <td className="px-5 py-3.5" style={{ color: 'var(--c-ink)' }}>
                  {editingId === c.id ? (
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit() }}
                      className="w-full max-w-xs"
                      style={{ background: 'var(--c-panel)' }}
                      autoFocus
                    />
                  ) : c.name}
                </td>
                <td className="px-5 py-3.5" style={{ color: 'var(--c-ink)' }}>
                  {editingId === c.id ? (
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit() }}
                      className="w-full max-w-xs"
                      style={{ background: 'var(--c-panel)' }}
                      placeholder="contacto@empresa.com"
                    />
                  ) : (
                    <span style={{ color: c.email ? 'var(--c-ink)' : 'var(--c-ghost)' }}>
                      {c.email || '—'}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5" style={{ color: 'var(--c-ink)' }}>
                  {editingId === c.id ? (
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit() }}
                      className="w-full max-w-xs"
                      style={{ background: 'var(--c-panel)' }}
                      placeholder="(555) 123-4567"
                    />
                  ) : (
                    <span style={{ color: c.phone ? 'var(--c-ink)' : 'var(--c-ghost)' }}>
                      {c.phone || '—'}
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex gap-3 justify-end">
                    {editingId === c.id ? (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); saveEdit() }}
                          className="text-xs font-semibold"
                          style={{ color: 'var(--c-mint)' }}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingId(null) }}
                          className="text-xs"
                          style={{ color: 'var(--c-ghost)' }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(c.id) }} className="btn-delete text-xs">
                          Eliminar
                        </button>
                      </>
                    )}
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
