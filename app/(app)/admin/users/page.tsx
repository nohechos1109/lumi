'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface User { id: string; username: string; role: string }

const inputCls = 'w-full'
const inputStyle = { background: 'var(--c-panel)' }

const labelCls = 'block text-xs font-bold uppercase tracking-widest mb-2'
const labelStyle = { color: 'var(--c-dim)', letterSpacing: '0.1em' }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [form, setForm] = useState({ username: '', role: 'sales', password: '' })
  const [adding, setAdding] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  async function load() {
    const r = await fetch('/api/admin/users')
    setUsers(await r.json())
  }

  useEffect(() => { load() }, [])

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === '' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setForm({ username: '', role: 'sales', password: '' })
    setAdding(false)
    load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
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
            Usuarios
          </h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'var(--c-ghost)' }}>
            {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
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
          {adding ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {adding && (
        <form
          onSubmit={handleAdd}
          className="rounded-2xl p-5 mb-5 flex gap-4 items-end flex-wrap"
          style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim-hi)' }}
        >
          <div>
            <label className={labelCls} style={labelStyle}>Usuario</label>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
              className={inputCls}
              style={{ ...inputStyle, width: '10rem' }}
            />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Contraseña</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              className={inputCls}
              style={{ ...inputStyle, width: '10rem' }}
            />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Rol</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              style={{ ...inputStyle, width: '8rem' }}
            >
              <option value="sales">Sales</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl text-sm font-bold uppercase tracking-wider"
            style={{ background: 'var(--c-gold)', color: '#090B10', letterSpacing: '0.08em' }}
          >
            Guardar
          </button>
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
              placeholder="Buscar por nombre de usuario..."
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

        {/* Filter — pill chip */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 mr-1" style={{ color: 'var(--c-ghost)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
            </svg>
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ background: roleFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: roleFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: roleFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: roleFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
            >
              <option value="">Rol</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="sales">Sales</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: roleFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Usuario</th>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Rol</th>
              <th className="px-5 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr
                key={u.id}
                className="tr-hover transition-colors"
                style={{ borderTop: '1px solid var(--c-rim)' }}
              >
                <td className="px-5 py-4 font-mono" style={{ color: 'var(--c-ink)' }}>{u.username}</td>
                <td className="px-5 py-4 capitalize font-mono text-xs" style={{ color: 'var(--c-dim)' }}>{u.role}</td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => setDeleteId(u.id)}
                    className="btn-delete text-xs"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {deleteId && (
        <ConfirmModal
          message="¿Eliminar este usuario? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          onConfirm={() => { handleDelete(deleteId); setDeleteId(null) }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}
