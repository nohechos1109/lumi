'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { ServiceProject } from '@/lib/queries/servicios'
import FilterSelect from '@/components/ui/FilterSelect'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open:        { label: 'Abierto',    cls: 'badge badge-scheduled' },
  in_progress: { label: 'En Proceso', cls: 'badge badge-in-progress' },
  completed:   { label: 'Completado', cls: 'badge badge-attended' },
  cancelled:   { label: 'Cancelado',  cls: 'badge badge-cancelled' },
}

export default function ServiceProjectsTable({ projects }: { projects: ServiceProject[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => projects.filter(p => {
    if (statusFilter && p.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.number.toLowerCase().includes(q) &&
          !(p.name || '').toLowerCase().includes(q) &&
          !(p.customer_name || '').toLowerCase().includes(q)) return false
    }
    return true
  }), [projects, search, statusFilter])

  if (projects.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--c-rim)', color: 'var(--c-dim)' }}>
        Aún no hay planeaciones de servicios.
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por número, nombre, cliente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] text-sm"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Todos los estados"
          options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
        />
      </div>

      <div
        className="rounded-xl overflow-hidden shadow-sm"
        style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Número</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Nombre</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Cliente</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Estado</th>
                <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Órdenes</th>
                <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Servicios</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-rim)]">
              {filtered.map(p => {
                const s = STATUS_MAP[p.status] ?? STATUS_MAP.open
                return (
                  <tr key={p.id} className="tr-hover transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold" style={{ letterSpacing: '0.08em' }}>
                      <Link href={`/servicios/projects/${p.id}`} className="hover:underline" style={{ color: 'var(--c-navy)' }}>
                        {p.number}
                      </Link>
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-ink)' }}>{p.name}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }}>{p.customer_name ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={s.cls}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono" style={{ color: 'var(--c-ink)' }}>{p.order_count ?? 0}</td>
                    <td className="px-5 py-4 text-right font-mono" style={{ color: 'var(--c-ink)' }}>{p.service_count ?? 0}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }} suppressHydrationWarning>
                      {new Date(p.created_at).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
