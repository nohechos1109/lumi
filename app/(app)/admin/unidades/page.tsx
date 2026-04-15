'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { toast, notifyRefresh } from '@/lib/toast'
import CustomerSearchSelect, { type CustomerOption } from '@/components/ui/CustomerSearchSelect'

interface Ruta { id: string; name: string; cliente_id: string | null; cliente_name?: string }
interface Unidad {
  id: string; name: string
  ruta_id: string | null; ruta_name?: string
  empresa_id: string | null; empresa_name?: string
  dueno_id: string | null; dueno_name?: string
  dashcam: string | null
  pantalla: boolean; impresora: boolean; reversa: boolean; reconocimiento_facial: boolean
  fecha_instalacion: string | null
  descripcion_instalacion: string | null
  observaciones: string | null
}
type Tab = 'rutas' | 'unidades'

const emptyForm = () => ({
  name: '', ruta_id: '', empresa_id: '', dueno_id: '',
  dashcam: '', pantalla: false, impresora: false, reversa: false, reconocimiento_facial: false,
  fecha_instalacion: '', descripcion_instalacion: '', observaciones: '',
})

export default function AdminUnidadesPage() {
  const [tab, setTab] = useState<Tab>('unidades')

  const [rutas,    setRutas]    = useState<Ruta[]>([])
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [contacts, setContacts] = useState<CustomerOption[]>([])

  // Rutas inline edit
  const [modalRuta,       setModalRuta]       = useState(false)
  const [newRuta,         setNewRuta]         = useState('')
  const [newRutaCliente,  setNewRutaCliente]  = useState('')
  const [editRuta,        setEditRuta]        = useState<Ruta | null>(null)
  const [editRutaName,    setEditRutaName]    = useState('')
  const [editRutaCliente, setEditRutaCliente] = useState('')

  // Filters
  const [filterRutaCliente,   setFilterRutaCliente]   = useState('')
  const [filterUnidadRuta,    setFilterUnidadRuta]    = useState('')
  const [filterUnidadEmpresa, setFilterUnidadEmpresa] = useState('')

  const filteredRutas = useMemo(() =>
    rutas.filter(r => !filterRutaCliente || r.cliente_id === filterRutaCliente),
    [rutas, filterRutaCliente]
  )

  const filteredUnidades = useMemo(() =>
    unidades.filter(u =>
      (!filterUnidadRuta    || u.ruta_id    === filterUnidadRuta) &&
      (!filterUnidadEmpresa || u.empresa_id === filterUnidadEmpresa)
    ),
    [unidades, filterUnidadRuta, filterUnidadEmpresa]
  )

  // Unidades modal
  const [modal,     setModal]     = useState<'new' | 'edit' | null>(null)
  const [form,      setForm]      = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)

  async function loadAll() {
    const [r, u, c] = await Promise.all([
      fetch('/api/rutas').then(x => x.json()),
      fetch('/api/unidades').then(x => x.json()),
      fetch('/api/customers').then(x => x.json()),
    ])
    setRutas(Array.isArray(r) ? r : [])
    setUnidades(Array.isArray(u) ? u : [])
    setContacts(Array.isArray(c) ? c : [])
  }
  useEffect(() => { loadAll() }, [])

  // ── Rutas ────────────────────────────────────────────────────────────────────
  async function handleAddRuta(e: React.FormEvent) {
    e.preventDefault()
    if (!newRuta.trim()) return
    const res = await fetch('/api/rutas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRuta.trim(), cliente_id: newRutaCliente || null }),
    })
    if (!res.ok) { toast((await res.json()).error ?? 'Error', 'error'); return }
    notifyRefresh(); setNewRuta(''); setNewRutaCliente(''); setModalRuta(false); loadAll()
  }
  async function handleEditRuta(e: React.FormEvent) {
    e.preventDefault()
    if (!editRuta) return
    const res = await fetch(`/api/rutas/${editRuta.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editRutaName.trim(), cliente_id: editRutaCliente || null }),
    })
    if (!res.ok) { toast((await res.json()).error ?? 'Error', 'error'); return }
    notifyRefresh(); setEditRuta(null); loadAll()
  }
  async function handleDeleteRuta(id: string) {
    if (!confirm('¿Eliminar esta ruta?')) return
    const res = await fetch(`/api/rutas/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast((await res.json()).error ?? 'No se puede eliminar', 'error'); return }
    notifyRefresh(); loadAll()
  }

  // ── Unidades ─────────────────────────────────────────────────────────────────
  function openNew() { setForm(emptyForm()); setEditingId(null); setModal('new') }
  function openEdit(u: Unidad) {
    setForm({
      name: u.name, ruta_id: u.ruta_id ?? '', empresa_id: u.empresa_id ?? '',
      dueno_id: u.dueno_id ?? '', dashcam: u.dashcam ?? '',
      pantalla: u.pantalla, impresora: u.impresora, reversa: u.reversa,
      reconocimiento_facial: u.reconocimiento_facial,
      fecha_instalacion: u.fecha_instalacion ?? '',
      descripcion_instalacion: u.descripcion_instalacion ?? '',
      observaciones: u.observaciones ?? '',
    })
    setEditingId(u.id)
    setModal('edit')
  }
  function buildPayload(f: typeof form) {
    return {
      name: f.name.trim(), ruta_id: f.ruta_id || null,
      empresa_id: f.empresa_id || null, dueno_id: f.dueno_id || null,
      dashcam: f.dashcam || null,
      pantalla: f.pantalla, impresora: f.impresora, reversa: f.reversa,
      reconocimiento_facial: f.reconocimiento_facial,
      fecha_instalacion: f.fecha_instalacion || null,
      descripcion_instalacion: f.descripcion_instalacion || null,
      observaciones: f.observaciones || null,
    }
  }
  async function handleSaveUnidad(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const url  = modal === 'edit' ? `/api/unidades/${editingId}` : '/api/unidades'
    const method = modal === 'edit' ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(form)),
    })
    if (!res.ok) { toast((await res.json()).error ?? 'Error', 'error'); return }
    notifyRefresh(); setModal(null); loadAll()
  }
  async function handleDeleteUnidad(id: string) {
    if (!confirm('¿Eliminar esta unidad?')) return
    const res = await fetch(`/api/unidades/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast((await res.json()).error ?? 'No se puede eliminar', 'error'); return }
    notifyRefresh(); loadAll()
  }

  return (
    <div>
      {/* Back */}
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75" style={{ color: 'var(--c-ghost)' }}>
          ← Volver al Dashboard Admin
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase" style={{ color: 'var(--c-ink)', letterSpacing: '0.1em' }}>
            {tab === 'rutas' ? 'Rutas' : 'Unidades'}
          </h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'var(--c-ghost)' }}>
            {tab === 'rutas'
              ? `${filteredRutas.length} ${filteredRutas.length === 1 ? 'ruta' : 'rutas'}`
              : `${filteredUnidades.length} ${filteredUnidades.length === 1 ? 'unidad' : 'unidades'}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab switcher */}
          <div className="relative flex rounded-full p-1 text-xs font-bold" style={{ background: 'var(--c-base)', border: '1px solid var(--c-rim)' }}>
            <div
              className="absolute top-1 bottom-1 rounded-full transition-all duration-200"
              style={{
                width: 'calc(50% - 2px)',
                left: tab === 'unidades' ? '4px' : 'calc(50% - 2px)',
                background: 'var(--c-navy)',
                boxShadow: '0 2px 8px rgba(27,52,97,0.25)',
              }}
            />
            {(['unidades', 'rutas'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setEditRuta(null) }}
                className="relative z-10 flex items-center gap-1.5 px-5 py-2 rounded-full uppercase tracking-wider transition-colors duration-200"
                style={{ color: tab === t ? '#fff' : 'var(--c-ghost)', minWidth: 96 }}
              >
                {t === 'unidades' ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><circle cx="7" cy="21" r="1"/><circle cx="17" cy="21" r="1"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12h18M3 6l9-3 9 3M3 18l9 3 9-3"/>
                  </svg>
                )}
                {t === 'unidades' ? 'Unidades' : 'Rutas'}
              </button>
            ))}
          </div>
          {tab === 'unidades' && (
            <button onClick={openNew}
              className="text-sm px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-opacity hover:opacity-85"
              style={{ background: 'var(--c-navy)', color: '#fff', letterSpacing: '0.08em' }}>
              + Nueva Unidad
            </button>
          )}
          {tab === 'rutas' && (
            <button onClick={() => { setNewRuta(''); setModalRuta(true) }}
              className="text-sm px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-opacity hover:opacity-85"
              style={{ background: 'var(--c-navy)', color: '#fff', letterSpacing: '0.08em' }}>
              + Nueva Ruta
            </button>
          )}
        </div>
      </div>

      {/* ── RUTAS ─────────────────────────────────────────────────────────────── */}
      {tab === 'rutas' && (
        <div>
          {/* Filtros rutas */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Cliente</label>
              <select className="text-sm rounded-xl px-3 py-2 pr-8"
                style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', color: filterRutaCliente ? 'var(--c-ink)' : 'var(--c-ghost)', outline: 'none', minWidth: 180 }}
                value={filterRutaCliente} onChange={e => setFilterRutaCliente(e.target.value)}>
                <option value="">Todos los clientes</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {filterRutaCliente && (
              <button onClick={() => setFilterRutaCliente('')}
                className="self-end text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-75"
                style={{ color: 'var(--c-ghost)', border: '1px solid var(--c-rim)' }}>
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Nombre</th>
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Cliente</th>
                  <th className="w-28 px-5 py-4 text-right text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRutas.length === 0 && (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-sm" style={{ color: 'var(--c-ghost)' }}>{rutas.length === 0 ? 'Sin rutas registradas' : 'Sin resultados'}</td></tr>
                )}
                {filteredRutas.map(r => (
                  <tr key={r.id} className="tr-hover transition-colors" style={{ borderTop: '1px solid var(--c-rim)' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--c-ink)' }}>{r.name}</td>
                    <td className="px-5 py-3 text-sm" style={{ color: 'var(--c-dim)' }}>{r.cliente_name ?? '—'}</td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <button onClick={() => { setEditRuta(r); setEditRutaName(r.name); setEditRutaCliente(r.cliente_id ?? '') }} className="text-xs font-semibold mr-3 hover:underline" style={{ color: 'var(--c-navy)' }}>Editar</button>
                      <button onClick={() => handleDeleteRuta(r.id)} className="text-xs font-semibold hover:underline" style={{ color: 'var(--c-rose)' }}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── UNIDADES ──────────────────────────────────────────────────────────── */}
      {tab === 'unidades' && (
        <div>
          {/* Filtros unidades */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Ruta</label>
              <select className="text-sm rounded-xl px-3 py-2 pr-8"
                style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', color: filterUnidadRuta ? 'var(--c-ink)' : 'var(--c-ghost)', outline: 'none', minWidth: 180 }}
                value={filterUnidadRuta} onChange={e => setFilterUnidadRuta(e.target.value)}>
                <option value="">Todas las rutas</option>
                {rutas.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Empresa</label>
              <select className="text-sm rounded-xl px-3 py-2 pr-8"
                style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', color: filterUnidadEmpresa ? 'var(--c-ink)' : 'var(--c-ghost)', outline: 'none', minWidth: 180 }}
                value={filterUnidadEmpresa} onChange={e => setFilterUnidadEmpresa(e.target.value)}>
                <option value="">Todas las empresas</option>
                {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {(filterUnidadRuta || filterUnidadEmpresa) && (
              <button onClick={() => { setFilterUnidadRuta(''); setFilterUnidadEmpresa('') }}
                className="self-end text-xs font-semibold px-3 py-2 rounded-xl hover:opacity-75"
                style={{ color: 'var(--c-ghost)', border: '1px solid var(--c-rim)' }}>
                Limpiar filtros
              </button>
            )}
          </div>
        <div className="rounded-2xl overflow-x-auto" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
          <table className="w-full text-sm" style={{ minWidth: 680 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Unidad</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Ruta</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Empresa</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Equipo</th>
                <th className="w-28 px-5 py-4 text-right text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnidades.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--c-ghost)' }}>{unidades.length === 0 ? 'Sin unidades registradas' : 'Sin resultados'}</td></tr>
              )}
              {filteredUnidades.map(u => (
                <tr key={u.id} className="tr-hover transition-colors" style={{ borderTop: '1px solid var(--c-rim)' }}>
                  <td className="px-5 py-3 font-semibold" style={{ color: 'var(--c-ink)' }}>{u.name}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--c-dim)' }}>{u.ruta_name ?? '—'}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--c-dim)' }}>{u.empresa_name ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.dashcam && <Chip label={u.dashcam} color="sky" />}
                      {u.pantalla && <Chip label="Pantalla" />}
                      {u.impresora && <Chip label="Impresora" />}
                      {u.reversa && <Chip label="Reversa" />}
                      {u.reconocimiento_facial && <Chip label="Facial" />}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(u)} className="text-xs font-semibold mr-3 hover:underline" style={{ color: 'var(--c-navy)' }}>Editar</button>
                    <button onClick={() => handleDeleteUnidad(u.id)} className="text-xs font-semibold hover:underline" style={{ color: 'var(--c-rose)' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* ── Modal: nueva ruta ─────────────────────────────────────────────────── */}
      {modalRuta && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={e => { if (e.target === e.currentTarget) setModalRuta(false) }}>
          <div className="w-full max-w-md rounded-2xl shadow-xl" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <h2 className="font-heading text-lg font-bold uppercase" style={{ color: 'var(--c-ink)', letterSpacing: '0.08em' }}>Nueva Ruta</h2>
              <button onClick={() => setModalRuta(false)} style={{ color: 'var(--c-ghost)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddRuta} className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Nombre *</label>
                  <input className="text-sm rounded-xl px-4 py-2.5" autoFocus required
                    style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }}
                    value={newRuta} onChange={e => setNewRuta(e.target.value)} placeholder="Ej: Ruta Norte" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Cliente</label>
                  <CustomerSearchSelect customers={contacts} value={newRutaCliente} onChange={setNewRutaCliente} />
                </div>
              </div>
              <div className="flex gap-3 pt-1" style={{ borderTop: '1px solid var(--c-rim)' }}>
                <button type="button" onClick={() => setModalRuta(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold mt-4"
                  style={{ color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-85 mt-4"
                  style={{ background: 'var(--c-navy)', color: '#fff', letterSpacing: '0.08em' }}>
                  Crear Ruta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: editar ruta ────────────────────────────────────────────────── */}
      {editRuta && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={e => { if (e.target === e.currentTarget) setEditRuta(null) }}>
          <div className="w-full max-w-md rounded-2xl shadow-xl" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <h2 className="font-heading text-lg font-bold uppercase" style={{ color: 'var(--c-ink)', letterSpacing: '0.08em' }}>Editar Ruta</h2>
              <button onClick={() => setEditRuta(null)} style={{ color: 'var(--c-ghost)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleEditRuta} className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Nombre *</label>
                  <input className="text-sm rounded-xl px-4 py-2.5" autoFocus required
                    style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }}
                    value={editRutaName} onChange={e => setEditRutaName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Cliente</label>
                  <CustomerSearchSelect customers={contacts} value={editRutaCliente} onChange={setEditRutaCliente} />
                </div>
              </div>
              <div className="flex gap-3 pt-1" style={{ borderTop: '1px solid var(--c-rim)' }}>
                <button type="button" onClick={() => setEditRuta(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold mt-4"
                  style={{ color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}>
                  Cancelar
                </button>
                <button type="submit"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-85 mt-4"
                  style={{ background: 'var(--c-navy)', color: '#fff', letterSpacing: '0.08em' }}>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: nueva / editar unidad ──────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="w-full max-w-2xl rounded-2xl shadow-xl overflow-y-auto" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', maxHeight: 'calc(100vh - 8rem)' }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <h2 className="font-heading text-lg font-bold uppercase" style={{ color: 'var(--c-ink)', letterSpacing: '0.08em' }}>
                {modal === 'new' ? 'Nueva Unidad' : 'Editar Unidad'}
              </h2>
              <button onClick={() => setModal(null)} style={{ color: 'var(--c-ghost)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <UnidadForm form={form} setForm={setForm} rutas={rutas} contacts={contacts} onSubmit={handleSaveUnidad} onCancel={() => setModal(null)} submitLabel={modal === 'new' ? 'Crear Unidad' : 'Guardar Cambios'} />
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ label, color = 'mint' }: { label: string; color?: 'mint' | 'sky' }) {
  const styles = {
    mint: { background: 'var(--c-mint-bg)', color: 'var(--c-mint)', border: '1px solid rgba(5,150,105,0.15)' },
    sky:  { background: 'var(--c-sky-bg)',  color: 'var(--c-sky)',  border: '1px solid rgba(3,105,161,0.15)'  },
  }
  return <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase" style={styles[color]}>{label}</span>
}

// ── UnidadForm ─────────────────────────────────────────────────────────────────
type FormState = ReturnType<typeof emptyForm>

function UnidadForm({ form, setForm, rutas, contacts, onSubmit, onCancel, submitLabel }: {
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  rutas: Ruta[]
  contacts: CustomerOption[]
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
}) {
  const inp = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }
  const set = (k: keyof FormState, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  return (
    <form onSubmit={onSubmit} className="px-6 py-5 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Unidad *</label>
          <input className="text-sm rounded-xl px-4 py-2.5" style={inp} required
            value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej: C113U37" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Ruta</label>
          <select className="text-sm rounded-xl px-4 py-2.5" style={inp}
            value={form.ruta_id} onChange={e => set('ruta_id', e.target.value)}>
            <option value="">Sin ruta</option>
            {rutas.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Empresa</label>
          <select className="text-sm rounded-xl px-4 py-2.5" style={inp}
            value={form.empresa_id} onChange={e => set('empresa_id', e.target.value)}>
            <option value="">Sin empresa</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Dueño</label>
          <select className="text-sm rounded-xl px-4 py-2.5" style={inp}
            value={form.dueno_id} onChange={e => set('dueno_id', e.target.value)}>
            <option value="">Sin dueño</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Dashcam / Streamax</label>
          <select className="text-sm rounded-xl px-4 py-2.5" style={inp}
            value={form.dashcam} onChange={e => set('dashcam', e.target.value)}>
            <option value="">Ninguno</option>
            <option value="dashcam">Dashcam</option>
            <option value="streamax">Streamax</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Fecha de instalación</label>
          <input type="date" className="text-sm rounded-xl px-4 py-2.5" style={inp}
            value={form.fecha_instalacion} onChange={e => set('fecha_instalacion', e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap gap-5 py-1">
        {([['pantalla','Pantalla'],['impresora','Impresora'],['reversa','Reversa'],['reconocimiento_facial','Reconocimiento Facial']] as [keyof FormState, string][]).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={Boolean(form[key])} onChange={e => set(key, e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm font-medium" style={{ color: 'var(--c-ink)' }}>{label}</span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Descripción de instalación</label>
          <textarea rows={2} className="text-sm rounded-xl px-4 py-2.5 resize-none" style={inp}
            value={form.descripcion_instalacion} onChange={e => set('descripcion_instalacion', e.target.value)} placeholder="Descripción del equipo instalado..." />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Observaciones</label>
          <textarea rows={2} className="text-sm rounded-xl px-4 py-2.5 resize-none" style={inp}
            value={form.observaciones} onChange={e => set('observaciones', e.target.value)} placeholder="Notas adicionales..." />
        </div>
      </div>

      <div className="flex gap-3 pt-1" style={{ borderTop: '1px solid var(--c-rim)' }}>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold mt-4"
          style={{ color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}>
          Cancelar
        </button>
        <button type="submit"
          className="px-5 py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-opacity hover:opacity-85 mt-4"
          style={{ background: 'var(--c-navy)', color: '#fff', letterSpacing: '0.08em' }}>
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
