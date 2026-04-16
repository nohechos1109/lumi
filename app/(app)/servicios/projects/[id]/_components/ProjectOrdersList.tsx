'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ServiceOrder } from '@/lib/queries/servicios'
import NewServiceOrderModal from '../../../_components/NewServiceOrderModal'

const ESTATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  pendiente: { label: 'Pendiente', bg: '#F1F5F9', text: '#475569' },
  agendado:  { label: 'Agendado',  bg: '#E0F2FE', text: '#0369A1' },
  en_curso:  { label: 'En curso',  bg: '#FEF3C7', text: '#B45309' },
  atendido:  { label: 'Atendido',  bg: '#DCFCE7', text: '#15803D' },
  cancelado: { label: 'Cancelado', bg: '#FFE4E6', text: '#BE123C' },
}

interface Props {
  projectId: string
  orders: ServiceOrder[]
  canCreate: boolean
}

export default function ProjectOrdersList({ projectId, orders, canCreate }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--c-ink)' }}>Órdenes de Servicio</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'var(--c-panel)', color: 'var(--c-ghost)' }}>
            {orders.length}
          </span>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: '#B45309', cursor: 'pointer', border: 'none' }}
            >
              + Nueva Orden
            </button>
          )}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--c-rim)', color: 'var(--c-dim)' }}>
          Sin órdenes aún.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--c-rim)' }}>
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Número</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Motivo</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
                <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Servicios</th>
                <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Agendada</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const e = ESTATUS_MAP[o.estatus] ?? ESTATUS_MAP.pendiente
                const total = (o.servicios_pendientes ?? 0) + (o.servicios_en_curso ?? 0) + (o.servicios_atendidos ?? 0)
                return (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                    <td className="px-4 py-2.5">
                      <Link href={`/servicios/orders/${o.id}`} className="font-mono font-medium hover:underline" style={{ color: '#B45309' }}>
                        {o.number}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--c-ink)' }}>{o.motivo_del_servicio ?? '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: e.bg, color: e.text }}>
                        {e.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>{total}</td>
                    <td className="px-4 py-2.5" style={{ color: 'var(--c-dim)' }} suppressHydrationWarning>
                      {o.fecha_hora_agendada ? new Date(o.fecha_hora_agendada).toLocaleDateString('es-MX') : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <NewServiceOrderModal projectId={projectId} onClose={() => setShowModal(false)} />}
    </div>
  )
}
