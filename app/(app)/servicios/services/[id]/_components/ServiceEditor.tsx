'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Service, ServiceEstatus } from '@/lib/queries/servicios'
import { notifyRefresh, toast } from '@/lib/toast'

const ESTATUS_OPTIONS: { value: ServiceEstatus; label: string }[] = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'agendado',  label: 'Agendado' },
  { value: 'en_curso',  label: 'En curso' },
  { value: 'atendido',  label: 'Atendido' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'rechazado', label: 'Rechazado' },
]

const ESTATUS_MAP: Record<string, string> = {
  pendiente: 'badge badge-pending',
  agendado:  'badge badge-scheduled',
  en_curso:  'badge badge-in-progress',
  atendido:  'badge badge-attended',
  cancelado: 'badge badge-cancelled',
  rechazado: 'badge badge-rejected',
}

const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }
const inp = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }

interface Props {
  service: Service
  canEdit: boolean
  canManageTech: boolean
  canApprove: boolean
  hasMaterials: boolean
  tecnicos: { id: string; username: string }[]
  isAdmin?: boolean
}

export default function ServiceEditor({ service, canEdit, canManageTech, canApprove, hasMaterials, tecnicos, isAdmin }: Props) {
  const router = useRouter()
  const [estatus, setEstatus] = useState<ServiceEstatus>(service.estatus)
  const [reporte, setReporte] = useState(service.reporte_tecnico ?? '')
  const [comentariosReporte, setComentariosReporte] = useState(service.comentarios_reporte ?? '')
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [showTechModal, setShowTechModal] = useState(false)

  async function saveField(field: string, value: string | null) {
    setSaving(true)
    try {
      const res = await fetch(`/api/servicios/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast(err.error || 'Error al guardar', 'error')
        return
      }
      toast('Guardado', 'success')
      notifyRefresh()
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(s: ServiceEstatus) {
    setEstatus(s)
    await saveField('estatus', s)
  }

  async function handleApprove() {
    setApproving(true)
    try {
      const res = await fetch(`/api/servicios/services/${service.id}/approve`, { method: 'POST' })
      const result = await res.json()
      if (!res.ok) {
        toast(result.error || 'Error al aprobar servicio', 'error')
        return
      }
      toast(`Servicio aprobado — nota ${result.saleNote.number} creada`, 'success')
      notifyRefresh()
      router.refresh()
    } finally {
      setApproving(false)
    }
  }

  const isApproved = !!service.approved_at
  const showApproveBtn = canApprove && estatus === 'atendido' && !isApproved && hasMaterials
  const stCls = ESTATUS_MAP[estatus] ?? ESTATUS_MAP.pendiente
  const techs = service.technicians ?? []

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-3xl font-bold font-mono" style={{ color: 'var(--c-ink)' }}>
              {service.number}
            </h1>
            <span className={stCls}>
              {ESTATUS_OPTIONS.find(o => o.value === estatus)?.label ?? estatus}
            </span>
          </div>
          <div className="text-sm mt-1 space-y-0.5" style={{ color: 'var(--c-dim)' }}>
            {service.customer_name && <div><span style={{ color: 'var(--c-ghost)' }}>Cliente:</span> {service.customer_name}</div>}
            {service.unidad_name && <div><span style={{ color: 'var(--c-ghost)' }}>Unidad:</span> {service.unidad_name}</div>}
            {service.motivo_visita && <div><span style={{ color: 'var(--c-ghost)' }}>Motivo:</span> {service.motivo_visita}</div>}
            {service.tipo_lugar && (
              <div>
                <span style={{ color: 'var(--c-ghost)' }}>Lugar:</span>{' '}
                <span className={`badge badge-${service.tipo_lugar}`}>{service.tipo_lugar === 'taller' ? 'Taller' : 'Calle'}</span>
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <span style={{ color: 'var(--c-ghost)' }}>Técnicos:</span>
              {!service.assign_all_technicians && techs.length === 0 && (
                <span style={{ color: 'var(--c-ghost)', fontStyle: 'italic' }}>Sin asignar</span>
              )}
              {service.assign_all_technicians && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}>
                  Todos
                </span>
              )}
              {techs.map(t => (
                <span
                  key={t.user_id}
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
                >
                  {t.username}
                </span>
              ))}
              {canManageTech && (
                <button
                  onClick={() => setShowTechModal(true)}
                  className="text-xs transition-opacity hover:opacity-70"
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--c-navy)', fontWeight: 600, padding: 0 }}
                >
                  Modificar
                </button>
              )}
            </div>
            {service.fecha_hora_agendada && (
              <div suppressHydrationWarning>
                <span style={{ color: 'var(--c-ghost)' }}>Agendado:</span>{' '}
                {new Date(service.fecha_hora_agendada).toLocaleString('es-MX')}
              </div>
            )}
            {service.comentarios_soporte && (
              <div className="mt-1"><span style={{ color: 'var(--c-ghost)' }}>Detalles:</span> {service.comentarios_soporte}</div>
            )}
          </div>
        </div>

        {canEdit && (
          <div className="flex flex-col items-end gap-2">
            <label className={labelCls} style={labelStyle}>Estado</label>
            <select
              value={estatus}
              onChange={e => handleStatusChange(e.target.value as ServiceEstatus)}
              disabled={saving}
              className="text-sm rounded-lg px-3 py-2"
              style={inp}
            >
              {ESTATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}
      </div>

      {(canEdit || reporte || comentariosReporte) && (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className={labelCls} style={labelStyle}>Reporte técnico</label>
            {canEdit ? (
              <textarea
                value={reporte}
                onChange={e => setReporte(e.target.value)}
                onBlur={() => saveField('reporte_tecnico', reporte || null)}
                rows={5}
                className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
                style={inp}
              />
            ) : (
              <p className="text-sm rounded-xl px-4 py-2.5 min-h-[7rem] whitespace-pre-wrap" style={{ ...inp, color: reporte ? 'var(--c-ink)' : 'var(--c-ghost)' }}>
                {reporte || 'Sin reporte'}
              </p>
            )}
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Comentarios del técnico</label>
            {canEdit ? (
              <textarea
                value={comentariosReporte}
                onChange={e => setComentariosReporte(e.target.value)}
                onBlur={() => saveField('comentarios_reporte', comentariosReporte || null)}
                rows={5}
                className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
                style={inp}
              />
            ) : (
              <p className="text-sm rounded-xl px-4 py-2.5 min-h-[7rem] whitespace-pre-wrap" style={{ ...inp, color: comentariosReporte ? 'var(--c-ink)' : 'var(--c-ghost)' }}>
                {comentariosReporte || 'Sin comentarios'}
              </p>
            )}
          </div>
        </div>
      )}

      {isApproved && (
        <div className="mt-8 rounded-xl p-4 flex items-center justify-between gap-4" style={{ background: 'var(--c-mint-bg)', border: '1px solid rgba(11,153,98,0.25)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--c-mint)' }}>
            Servicio aprobado
          </p>
          {isAdmin && service.sale_note_id && service.sale_id && (
            <Link
              href={`/ventas/${service.sale_id}/notas/${service.sale_note_id}`}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(11,153,98,0.12)', color: 'var(--c-mint)', border: '1px solid rgba(11,153,98,0.3)', textDecoration: 'none' }}
            >
              Ver nota de venta
            </Link>
          )}
        </div>
      )}

      {showApproveBtn && (
        <div className="mt-8 rounded-xl p-5" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--c-ink)' }}>Aprobar servicio</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--c-dim)' }}>
            Se generará una nota de venta automática con los materiales registrados.
          </p>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: approving ? 'var(--c-rim-hi)' : 'var(--c-mint)', cursor: approving ? 'not-allowed' : 'pointer', border: 'none', opacity: approving ? 0.6 : 1, boxShadow: '0 2px 8px rgba(5,150,105,0.20)' }}
          >
            {approving ? 'Aprobando...' : 'Aprobar y generar nota'}
          </button>
        </div>
      )}

      {estatus === 'atendido' && !isApproved && !hasMaterials && canApprove && (
        <div className="mt-8 rounded-xl p-4" style={{ border: '1px dashed var(--c-rim)', color: 'var(--c-dim)' }}>
          <p className="text-sm">
            Registra materiales antes de aprobar.
          </p>
        </div>
      )}

      {showTechModal && (
        <TechModal
          serviceId={service.id}
          current={techs}
          all={tecnicos}
          initialAssignAll={service.assign_all_technicians}
          onClose={() => { setShowTechModal(false); router.refresh() }}
        />
      )}
    </div>
  )
}

function TechModal({
  serviceId,
  current,
  all,
  initialAssignAll,
  onClose,
}: {
  serviceId: string
  current: { user_id: string; username?: string }[]
  all: { id: string; username: string }[]
  initialAssignAll: boolean
  onClose: () => void
}) {
  const [assignAll, setAssignAll] = useState(initialAssignAll)
  const [selected, setSelected] = useState<Set<string>>(new Set(current.map(t => t.user_id)))
  const [saving, setSaving] = useState(false)

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  async function save() {
    setSaving(true)
    try {
      const ops: Promise<unknown>[] = []
      if (assignAll !== initialAssignAll) {
        ops.push(fetch(`/api/servicios/services/${serviceId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assign_all_technicians: assignAll }),
        }))
      }
      const currentIds = new Set(current.map(t => t.user_id))
      const toAdd = [...selected].filter(id => !currentIds.has(id))
      const toRemove = [...currentIds].filter(id => !selected.has(id))
      ops.push(
        ...toAdd.map(id =>
          fetch(`/api/servicios/services/${serviceId}/technicians`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: id }),
          })
        ),
        ...toRemove.map(id =>
          fetch(`/api/servicios/services/${serviceId}/technicians?user_id=${id}`, { method: 'DELETE' })
        ),
      )
      await Promise.all(ops)
      toast('Técnicos actualizados', 'success')
      onClose()
    } catch {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--c-rim)' }}>
          <h2 className="font-heading text-base font-bold" style={{ color: 'var(--c-ink)' }}>
            Técnicos asignados
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:opacity-70"
            style={{ color: 'var(--c-dim)', cursor: 'pointer', background: 'transparent', border: 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setAssignAll(v => !v)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{
                background: assignAll ? 'var(--c-navy)' : 'var(--c-panel)',
                color: assignAll ? '#fff' : 'var(--c-ink)',
                border: assignAll ? '1px solid var(--c-navy)' : '1px solid var(--c-rim)',
                cursor: 'pointer',
              }}
            >
              Todos
            </button>
            {all.map(t => {
              const active = selected.has(t.id)
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggle(t.id)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style={{
                    background: active ? 'var(--c-navy)' : 'var(--c-panel)',
                    color: active ? '#fff' : 'var(--c-ink)',
                    border: active ? '1px solid var(--c-navy)' : '1px solid var(--c-rim)',
                    cursor: 'pointer',
                  }}
                >
                  {t.username}
                </button>
              )
            })}
          </div>

          <div className="flex gap-3 pt-1" style={{ borderTop: '1px solid var(--c-rim)' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-75"
              style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
              style={{
                background: saving ? 'var(--c-rim-hi)' : 'var(--c-navy)',
                cursor: saving ? 'not-allowed' : 'pointer',
                border: 'none',
                opacity: saving ? 0.75 : 1,
              }}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
