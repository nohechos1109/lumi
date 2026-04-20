'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { ServiceOrder } from '@/lib/queries/servicios'
import FilterSelect from '@/components/ui/FilterSelect'

const ESTATUS_MAP: Record<string, { label: string; cls: string }> = {
  borrador:  { label: 'Borrador',  cls: 'badge badge-pending' },
  pendiente: { label: 'Pendiente', cls: 'badge badge-pending' },
  agendado:  { label: 'Agendado',  cls: 'badge badge-scheduled' },
  en_curso:  { label: 'En curso',  cls: 'badge badge-in-progress' },
  terminado: { label: 'Terminado', cls: 'badge badge-done' },
  atendido:  { label: 'Atendido',  cls: 'badge badge-attended' },
  cancelado: { label: 'Cancelado', cls: 'badge badge-cancelled' },
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
          className="flex-1 min-w-[200px] text-sm"
        />
        <FilterSelect
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="Todos los estados"
          options={Object.entries(ESTATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
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
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Proyecto</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Cliente</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Motivo</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Estado</th>
                <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Servicios</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Creado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-rim)]">
              {filtered.map(o => {
                const s = ESTATUS_MAP[o.estatus] ?? ESTATUS_MAP.pendiente
                const totalServices = (o.servicios_pendientes ?? 0) + (o.servicios_en_curso ?? 0) + (o.servicios_atendidos ?? 0)
                return (
                  <tr key={o.id} className="tr-hover transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold" style={{ letterSpacing: '0.08em' }}>
                      <Link href={`/servicios/orders/${o.id}`} className="hover:underline" style={{ color: 'var(--c-navy)' }}>
                        {o.number}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      {o.project_number ? (
                        <Link href={`/servicios/projects/${o.service_project_id}`} className="hover:underline" style={{ color: 'var(--c-ink)' }}>
                          {o.project_name || o.project_number}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--c-dim)' }}>—</span>
                      )}
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }}>{o.customer_name ?? '—'}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-dim)', maxWidth: 200 }}>
                      <span className="line-clamp-1">{o.motivo_del_servicio ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={s.cls}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono" style={{ color: 'var(--c-ink)' }}>{totalServices}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }} suppressHydrationWarning>
                      {new Date(o.created_at).toLocaleDateString('es-MX')}
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
