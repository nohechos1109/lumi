'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Service } from '@/lib/queries/servicios'
import NewServiceModal from '../../../_components/NewServiceModal'

const ESTATUS_MAP: Record<string, { label: string; cls: string }> = {
  pendiente:   { label: 'Pendiente',   cls: 'badge badge-pending' },
  agendado:    { label: 'Agendado',    cls: 'badge badge-scheduled' },
  en_curso:    { label: 'En curso',    cls: 'badge badge-in-progress' },
  en_revision: { label: 'En revisión', cls: 'badge badge-in-revision' },
  terminado:   { label: 'Terminado',   cls: 'badge badge-done' },
  atendido:    { label: 'Atendido',    cls: 'badge badge-attended' },
  cancelado:   { label: 'Cancelado',   cls: 'badge badge-rejected' },
  rechazado:   { label: 'Rechazado',   cls: 'badge badge-rejected' },
}

interface Props {
  orderId: string
  customerId: string | null
  tipoLugar: 'calle' | 'taller' | null
  motivo: string | null
  services: Service[]
  canCreate: boolean
  role?: string
}

export default function OrderServicesList({ orderId, customerId, tipoLugar, motivo, services, canCreate, role }: Props) {
  const [showModal, setShowModal] = useState(false)
  const router = useRouter()

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold" style={{ color: 'var(--c-ink)' }}>Servicios</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'var(--c-panel)', color: 'var(--c-ghost)' }}>
            {services.length}
          </span>
          {canCreate && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'var(--c-navy)', boxShadow: '0 2px 8px rgba(37,99,235,0.25)', border: 'none', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nuevo Servicio
            </button>
          )}
        </div>
      </div>

      {services.length === 0 ? (
        <div className="rounded-xl p-8 text-center" style={{ border: '1px dashed var(--c-rim)', color: 'var(--c-dim)' }}>
          Sin servicios.
        </div>
      ) : (
        <div
          className="rounded-xl overflow-hidden shadow-sm"
          style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)', boxShadow: '0 1px 3px rgba(15,23,42,0.04)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Número</th>
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Unidad</th>
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Motivo</th>
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Estado</th>
                  <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Agendado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--c-rim)]">
                {services.map(s => {
                  const e = ESTATUS_MAP[s.estatus] ?? ESTATUS_MAP.pendiente
                  return (
                    <tr
                      key={s.id}
                      className="tr-hover transition-colors"
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/servicios/services/${s.id}`)}
                    >
                      <td className="px-5 py-4 font-mono text-xs font-bold" style={{ letterSpacing: '0.08em', color: 'var(--c-navy)' }}>
                        {s.number}
                      </td>
                      <td className="px-5 py-4" style={{ color: 'var(--c-dim)' }}>{s.unidad_name ?? '—'}</td>
                      <td className="px-5 py-4" style={{ color: 'var(--c-ink)' }}>{s.motivo_visita ?? '—'}</td>
                      <td className="px-5 py-4">
                        <span className={e.cls}>{e.label}</span>
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
      )}

      {showModal && (
        <NewServiceModal
          prefillOrderId={orderId}
          prefillCustomerId={customerId}
          prefillTipoLugar={tipoLugar}
          prefillMotivo={motivo}
          compact={role === 'tecnico'}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
