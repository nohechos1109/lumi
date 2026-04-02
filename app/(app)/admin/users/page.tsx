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

  async function load() {
    const r = await fetch('/api/admin/users')
    setUsers(await r.json())
  }

  useEffect(() => { load() }, [])

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
            {users.map(u => (
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
