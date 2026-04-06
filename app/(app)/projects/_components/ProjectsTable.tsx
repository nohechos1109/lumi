'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Project {
  id: string
  name: string
  customer_name?: string
  executive_name?: string
  date: string
  status: string
  quote_count?: number
}

const PROJECT_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  follow_up: { label: 'Seguimiento', cls: 'badge badge-sent' },
  demo:      { label: 'Demo',        cls: 'badge badge-demo' },
  approved:  { label: 'Aprobado',    cls: 'badge badge-confirmed' },
  process:   { label: 'En Proceso',  cls: 'badge badge-process' },
  cancelled: { label: 'Cancelado',   cls: 'badge badge-cancelled' },
  finished:  { label: 'Terminado',   cls: 'badge badge-hold' },
}

export default function ProjectsTable({ projects, role }: { projects: Project[], role: string }) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [executiveFilter, setExecutiveFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  const isSales = role === 'sales'

  async function handleDelete(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteId(null)
      router.refresh()
    }
  }

  // Pre-calculate unique values for filters
  const customers = Array.from(new Set(projects.map(p => p.customer_name).filter(Boolean))).sort()
  const executives = Array.from(new Set(projects.map(p => p.executive_name).filter(Boolean))).sort()
  const dates = Array.from(new Set(projects.map(p => {
    const d = new Date(p.date)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }))).sort().reverse()

  const filteredProjects = projects.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    
    const matchesStatus = statusFilter === '' || p.status === statusFilter
    const matchesCustomer = customerFilter === '' || p.customer_name === customerFilter
    const matchesExecutive = executiveFilter === '' || p.executive_name === executiveFilter
    
    let matchesDate = true
    if (dateFilter) {
      const pDate = new Date(p.date)
      const filterDate = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`
      matchesDate = filterDate === dateFilter
    }

    return matchesSearch && matchesStatus && matchesCustomer && matchesExecutive && matchesDate
  })

  if (projects.length === 0) {
    return (
      <div
        className="text-center py-24 rounded-xl"
        style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}
      >
        <p className="text-base font-semibold" style={{ color: 'var(--c-dim)' }}>
          Sin proyectos
        </p>
        <p className="text-sm mt-1.5" style={{ color: 'var(--c-ghost)' }}>
          Crea tu primer proyecto para organizar tus cotizaciones.
        </p>
      </div>
    )
  }

  const deleteTarget = projects.find(p => p.id === deleteId)

  return (
    <>
      {/* Controls Bar */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Search bar — Google-style */}
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
              placeholder="Buscar por nombre o cliente..."
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

        {/* Filters — pill chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 mr-1" style={{ color: 'var(--c-ghost)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
            </svg>
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ background: statusFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: statusFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: statusFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: statusFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
            >
              <option value="">Estado</option>
              {Object.entries(PROJECT_STATUS_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: statusFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={customerFilter}
              onChange={(e) => setCustomerFilter(e.target.value)}
              style={{ background: customerFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: customerFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: customerFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: customerFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
            >
              <option value="">Cliente</option>
              {customers.map(c => (
                <option key={c} value={c!}>{c}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: customerFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          {!isSales && executives.length > 0 && (
            <div className="relative">
              <select
                className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
                value={executiveFilter}
                onChange={(e) => setExecutiveFilter(e.target.value)}
                style={{ background: executiveFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: executiveFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: executiveFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: executiveFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
              >
                <option value="">Vendedor</option>
                {executives.map(e => (
                  <option key={e} value={e!}>{e}</option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: executiveFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </div>
          )}

          <div className="relative">
            <select
              className="appearance-none pl-3.5 pr-7 h-8 rounded-full outline-none cursor-pointer text-xs font-semibold transition-all"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{ background: dateFilter ? 'var(--c-navy-bg)' : 'var(--c-card)', border: dateFilter ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)', color: dateFilter ? 'var(--c-navy)' : 'var(--c-dim)', boxShadow: dateFilter ? 'none' : '0 1px 3px rgba(27,52,97,0.05)' }}
            >
              <option value="">Fecha</option>
              {dates.map(d => {
                const [y, m] = d.split('-')
                const dateLabel = new Date(parseInt(y), parseInt(m) - 1).toLocaleString('es-MX', { month: 'long', year: 'numeric' })
                return <option key={d} value={d}>{dateLabel}</option>
              })}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: dateFilter ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: 0.6 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)', boxShadow: '0 1px 4px rgba(27,52,97,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Proyecto</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Cliente</th>
                {!isSales && (
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Vendedor</th>
                )}
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Fecha</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Estado</th>
                <th className="px-5 py-4 w-28"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-rim)]">
              {filteredProjects.map(p => {
                const s = PROJECT_STATUS_LABELS[p.status] ?? { label: p.status, cls: 'badge badge-expired' }
                return (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/projects/${p.id}`)}
                    className="tr-hover transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 font-bold" style={{ color: 'var(--c-navy)' }}>
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-[10px] font-normal opacity-60 uppercase">{p.quote_count} {p.quote_count === 1 ? 'cotización' : 'cotizaciones'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-semibold" style={{ color: 'var(--c-ink)' }}>
                      {p.customer_name}
                    </td>
                    {!isSales && (
                      <td className="px-5 py-4 text-xs font-medium" style={{ color: 'var(--c-dim)' }}>
                        {p.executive_name || '—'}
                      </td>
                    )}
                    <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                      {new Date(p.date).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={s.cls}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          aria-label="Eliminar proyecto"
                          onClick={(e) => { e.stopPropagation(); setDeleteId(p.id) }}
                          className="btn-delete text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center">
                    <p className="text-[var(--c-ghost)] font-mono text-sm uppercase tracking-widest">No se encontraron proyectos</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && deleteTarget && (
        <ConfirmModal
          message={`¿Eliminar el proyecto "${deleteTarget.name}"? Las cotizaciones relacionadas no se borrarán, pero dejarán de estar vinculadas a este proyecto.`}
          confirmLabel="Eliminar"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
