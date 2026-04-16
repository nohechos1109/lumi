'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { ServiceOrder } from '@/lib/queries/servicios'

const ESTATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pendiente: { label: 'Pendiente', bg: '#F1F5F9', text: '#475569' },
  agendado:  { label: 'Agendado',  bg: '#E0F2FE', text: '#0369A1' },
  en_curso:  { label: 'En curso',  bg: '#FEF3C7', text: '#B45309' },
  atendido:  { label: 'Atendido',  bg: '#DCFCE7', text: '#15803D' },
  cancelado: { label: 'Cancelado', bg: '#FFE4E6', text: '#BE123C' },
}

export default function ServiceOrdersTable({ orders }: { orders: ServiceOrder[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => orders.filter(o => {
    if (statusFilter && o.estatus !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!o.number.toLowerCase().includes(q) &&
          !(o.project_name || '').toLowerCase().includes(q) &&
          !(o.project_number || '').toLowerCase().includes(q) &&
          !(o.customer_name || '').toLowerCase().includes(q) &&
          !(o.motivo_del_servicio || '').toLowerCase().includes(q)) return false
    }
    return true
  }), [orders, search, statusFilter])

  if (orders.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--c-rim)', color: 'var(--c-dim)' }}>
        No hay órdenes de servicio.
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por número, proyecto, cliente, motivo..."
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
          <option value="pendiente">Pendiente</option>
          <option value="agendado">Agendado</option>
          <option value="en_curso">En curso</option>
          <option value="atendido">Atendido</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--c-rim)' }}>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Número</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Proyecto</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Cliente</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Motivo</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
              <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Servicios</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Creado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(o => {
              const s = ESTATUS_MAP[o.estatus] ?? ESTATUS_MAP.pendiente
              const totalServices = (o.servicios_pendientes ?? 0) + (o.servicios_en_curso ?? 0) + (o.servicios_atendidos ?? 0)
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                  <td className="px-4 py-2.5">
                    <Link href={`/servicios/orders/${o.id}`} className="font-mono font-medium hover:underline" style={{ color: '#B45309' }}>
                      {o.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5">
                    {o.project_number ? (
                      <Link href={`/servicios/projects/${o.service_project_id}`} className="hover:underline" style={{ color: 'var(--c-ink)' }}>
                        {o.project_name || o.project_number}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--c-dim)' }}>—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }}>{o.customer_name ?? '—'}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)', maxWidth: 200 }}>
                    <span className="line-clamp-1">{o.motivo_del_servicio ?? '—'}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.bg, color: s.text }}>
                      {s.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>{totalServices}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }} suppressHydrationWarning>
                    {new Date(o.created_at).toLocaleDateString('es-MX')}
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
