'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Service } from '@/lib/queries/servicios'
import PromoteServiceModal from './PromoteServiceModal'
import FilterSelect from '@/components/ui/FilterSelect'

const ESTATUS_MAP: Record<string, { label: string; cls: string }> = {
  pendiente:  { label: 'Pendiente',  cls: 'badge badge-pending' },
  agendado:   { label: 'Agendado',   cls: 'badge badge-scheduled' },
  en_curso:   { label: 'En curso',   cls: 'badge badge-in-progress' },
  atendido:   { label: 'Atendido',   cls: 'badge badge-attended' },
  cancelado:  { label: 'Cancelado',  cls: 'badge badge-cancelled' },
  rechazado:  { label: 'Rechazado',  cls: 'badge badge-rejected' },
}

export default function ServicesTable({ services, role, canPromote }: { services: Service[]; role: string; canPromote: boolean }) {
  void role
  const [promoteTarget, setPromoteTarget] = useState<Service | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [scopeFilter, setScopeFilter] = useState<'' | 'walk_in' | 'with_order'>('')

  const filtered = useMemo(() => services.filter(s => {
    if (statusFilter && s.estatus !== statusFilter) return false
    if (scopeFilter === 'walk_in' && s.service_order_id) return false
    if (scopeFilter === 'with_order' && !s.service_order_id) return false
    if (search) {
      const q = search.toLowerCase()
      if (!s.number.toLowerCase().includes(q) &&
          !(s.motivo_visita || '').toLowerCase().includes(q) &&
          !(s.unidad_name || '').toLowerCase().includes(q) &&
          !(s.customer_name || '').toLowerCase().includes(q)) return false
    }
    return true
  }), [services, search, statusFilter, scopeFilter])

  if (services.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--c-rim)', color: 'var(--c-dim)' }}>
        Sin servicios.
      </div>
    )
  }

  return (
    <div>
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar por número, motivo, unidad, cliente..."
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
        <FilterSelect
          value={scopeFilter}
          onChange={v => setScopeFilter(v as '' | 'walk_in' | 'with_order')}
          placeholder="Todos"
          options={[
            { value: 'with_order', label: 'Con orden' },
            { value: 'walk_in', label: 'Walk-in' },
          ]}
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
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Motivo</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Unidad</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Cliente</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Lugar</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Orden</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Estado</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Agendado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-rim)]">
              {filtered.map(s => {
                const st = ESTATUS_MAP[s.estatus] ?? ESTATUS_MAP.pendiente
                return (
                  <tr key={s.id} className="tr-hover transition-colors">
                    <td className="px-5 py-4 font-mono text-xs font-bold" style={{ letterSpacing: '0.08em' }}>
                      <Link href={`/servicios/services/${s.id}`} className="hover:underline" style={{ color: 'var(--c-navy)' }}>
                        {s.number}
                      </Link>
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-ink)' }}>{s.motivo_visita ?? '—'}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }}>{s.unidad_name ?? '—'}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }}>{s.customer_name ?? '—'}</td>
                    <td className="px-5 py-4">
                      {s.tipo_lugar ? (
                        <span className={`badge badge-${s.tipo_lugar}`}>{s.tipo_lugar === 'taller' ? 'Taller' : 'Calle'}</span>
                      ) : <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {s.order_number ? (
                        <Link href={`/servicios/orders/${s.service_order_id}`} className="font-mono text-xs hover:underline" style={{ color: 'var(--c-navy)' }}>
                          {s.order_number}
                        </Link>
                      ) : canPromote ? (
                        <button
                          onClick={() => setPromoteTarget(s)}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
                          style={{
                            background: 'var(--c-gold-bg)',
                            color: 'var(--c-gold)',
                            border: '1px solid var(--c-gold-bd)',
                            cursor: 'pointer',
                          }}
                        >
                          Dar seguimiento
                        </button>
                      ) : (
                        <span className="text-xs italic" style={{ color: 'var(--c-ghost)' }}>walk-in</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={st.cls}>{st.label}</span>
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }} suppressHydrationWarning>
                      {s.fecha_hora_agendada ? new Date(s.fecha_hora_agendada).toLocaleDateString('es-MX') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {promoteTarget && (
        <PromoteServiceModal
          serviceId={promoteTarget.id}
          serviceNumber={promoteTarget.number}
          motivo={promoteTarget.motivo_visita}
          onClose={() => setPromoteTarget(null)}
        />
      )}
    </div>
  )
}
