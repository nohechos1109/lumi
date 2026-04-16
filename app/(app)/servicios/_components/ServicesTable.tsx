'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { Service } from '@/lib/queries/servicios'
import PromoteServiceModal from './PromoteServiceModal'

const ESTATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pendiente:  { label: 'Pendiente',  bg: '#F1F5F9', text: '#475569' },
  agendado:   { label: 'Agendado',   bg: '#E0F2FE', text: '#0369A1' },
  en_curso:   { label: 'En curso',   bg: '#FEF3C7', text: '#B45309' },
  atendido:   { label: 'Atendido',   bg: '#DCFCE7', text: '#15803D' },
  cancelado:  { label: 'Cancelado',  bg: '#FFE4E6', text: '#BE123C' },
  rechazado:  { label: 'Rechazado',  bg: '#FEE2E2', text: '#991B1B' },
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
          {Object.entries(ESTATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select
          value={scopeFilter}
          onChange={e => setScopeFilter(e.target.value as '' | 'walk_in' | 'with_order')}
          className="text-sm rounded-lg px-3 py-2"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
        >
          <option value="">Todos</option>
          <option value="with_order">Con orden</option>
          <option value="walk_in">Walk-in</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--c-rim)' }}>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Número</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Motivo</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Unidad</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Cliente</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Lugar</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Orden</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
              <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Agendado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const st = ESTATUS_MAP[s.estatus] ?? ESTATUS_MAP.pendiente
              return (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                  <td className="px-4 py-2.5">
                    <Link href={`/servicios/services/${s.id}`} className="font-mono font-medium hover:underline" style={{ color: 'var(--c-navy)' }}>
                      {s.number}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--c-ink)' }}>{s.motivo_visita ?? '—'}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }}>{s.unidad_name ?? '—'}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }}>{s.customer_name ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    {s.tipo_lugar ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                        background: s.tipo_lugar === 'taller' ? '#E0F2FE' : '#FEF3C7',
                        color: s.tipo_lugar === 'taller' ? '#0369A1' : '#B45309',
                      }}>{s.tipo_lugar === 'taller' ? 'Taller' : 'Calle'}</span>
                    ) : <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.order_number ? (
                      <Link href={`/servicios/orders/${s.service_order_id}`} className="font-mono text-xs hover:underline" style={{ color: 'var(--c-navy)' }}>
                        {s.order_number}
                      </Link>
                    ) : canPromote ? (
                      <button
                        onClick={() => setPromoteTarget(s)}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{
                          background: '#FEF3C7',
                          color: '#B45309',
                          border: '1px solid #F59E0B',
                          cursor: 'pointer',
                        }}
                      >
                        Dar seguimiento
                      </button>
                    ) : (
                      <span className="text-xs italic" style={{ color: 'var(--c-ghost)' }}>walk-in</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.text }}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }} suppressHydrationWarning>
                    {s.fecha_hora_agendada ? new Date(s.fecha_hora_agendada).toLocaleDateString('es-MX') : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
