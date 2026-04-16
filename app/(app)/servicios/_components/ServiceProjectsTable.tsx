'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { ServiceProject } from '@/lib/queries/servicios'

const STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  open:         { label: 'Abierto',     bg: '#E0F2FE', text: '#0369A1' },
  in_progress:  { label: 'En Proceso',  bg: '#FEF3C7', text: '#B45309' },
  completed:    { label: 'Completado',  bg: '#DCFCE7', text: '#15803D' },
  cancelled:    { label: 'Cancelado',   bg: '#FFE4E6', text: '#BE123C' },
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
        Aún no hay proyectos de servicios.
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
          className="flex-1 min-w-[200px] text-sm rounded-lg px-3 py-2"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm rounded-lg px-3 py-2"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
        >
          <option value="">Todos los estados</option>
          <option value="open">Abierto</option>
          <option value="in_progress">En Proceso</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--c-rim)' }}>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Número</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Nombre</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Cliente</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
              <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Órdenes</th>
              <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Servicios</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Creado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => {
              const s = STATUS_MAP[p.status] ?? STATUS_MAP.open
              return (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                  <td className="px-4 py-2.5">
                    <Link href={`/servicios/projects/${p.id}`} className="font-mono font-medium hover:underline" style={{ color: '#B45309' }}>
                      {p.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--c-ink)' }}>{p.name}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }}>{p.customer_name ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>{p.order_count ?? 0}</td>
                  <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>{p.service_count ?? 0}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }} suppressHydrationWarning>
                    {new Date(p.created_at).toLocaleDateString('es-MX')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
