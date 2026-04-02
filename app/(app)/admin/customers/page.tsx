'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Customer { id: string; name: string }

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [name, setName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  async function load() {
    const r = await fetch('/api/admin/customers')
    setCustomers(await r.json())
  }

  useEffect(() => { load() }, [])

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    setName(''); setAdding(false); load()
  }

  function startEdit(c: Customer) {
    setEditingId(c.id)
    setEditName(c.name)
  }

  async function saveEdit() {
    if (!editingId) return
    await fetch(`/api/admin/customers/${editingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    setEditingId(null)
    setEditName('')
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
            background: adding ? 'var(--c-rim-hi)' : 'var(--c-gold)',
            color: adding ? 'var(--c-dim)' : '#090B10',
            letterSpacing: '0.08em',
          }}
        >
          {adding ? 'Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl p-5 mb-5 flex gap-4 items-end"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim-hi)' }}
        >
          <div className="flex-1">
            <label
              className="block text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}
            >
              Nombre del cliente
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
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-wider"
            style={{ background: 'var(--c-gold)', color: '#090B10' }}
          >
            Guardar
          </button>
        </form>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 rounded-xl shadow-sm" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Buscar por nombre de cliente..."
            className="w-full pl-11 pr-4 py-2.5 rounded-lg outline-none focus:ring-2 focus:ring-[var(--c-sky)] transition-all text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              background: 'var(--c-base)', 
              border: '1px solid var(--c-rim)',
              color: 'var(--c-ink)'
            }}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--c-ghost)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
        </div>
        <div className="flex items-center px-2 text-xs font-mono uppercase tracking-tighter" style={{ color: 'var(--c-ghost)' }}>
          {filteredCustomers.length} resultados
        </div>
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
