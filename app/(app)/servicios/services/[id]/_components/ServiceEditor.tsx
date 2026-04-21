'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Service, ServiceEstatus } from '@/lib/queries/servicios'
import { notifyRefresh, toast } from '@/lib/toast'

const ESTATUS_MAP: Record<string, { label: string; cls: string }> = {
  pendiente:   { label: 'Pendiente',   cls: 'badge badge-pending' },
  agendado:    { label: 'Agendado',    cls: 'badge badge-scheduled' },
  en_curso:    { label: 'En curso',    cls: 'badge badge-in-progress' },
  en_revision: { label: 'En revisión', cls: 'badge badge-in-revision' },
  terminado:   { label: 'Terminado',   cls: 'badge badge-done' },
  cancelado:   { label: 'Cancelado',   cls: 'badge badge-cancelled' },
  rechazado:   { label: 'Rechazado',   cls: 'badge badge-rejected' },
}

const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }
const inp = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }

interface Props {
  service: Service
  canEdit: boolean
  canEditReport: boolean
  canChangeStatus: boolean
  canManageTech: boolean
  canApprove: boolean
  hasMaterials: boolean
  tecnicos: { id: string; username: string }[]
  isAdmin?: boolean
}

export default function ServiceEditor({ service, canEdit, canEditReport, canChangeStatus, canManageTech, canApprove, hasMaterials, tecnicos, isAdmin }: Props) {
  const router = useRouter()
  const [estatus, setEstatus] = useState<ServiceEstatus>(service.estatus)
  const [reporte, setReporte] = useState(service.reporte_tecnico ?? '')
  const [comentariosReporte, setComentariosReporte] = useState(service.comentarios_reporte ?? '')
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [showTechModal, setShowTechModal] = useState(false)
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<'en_revision' | 'cancelado'>('cancelado')
  const [approvingCancel, setApprovingCancel] = useState(false)

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

  async function changeStatus(next: ServiceEstatus) {
    setSaving(true)
    try {
      const res = await fetch(`/api/servicios/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estatus: next }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast(err.error || 'Error al cambiar estado', 'error')
        return
      }
      setEstatus(next)
      toast('Estado actualizado', 'success')
      notifyRefresh()
      router.refresh()
    } finally {
      setSaving(false)
    }
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
      setEstatus('terminado')
      toast(`Servicio terminado — nota ${result.saleNote.number} creada`, 'success')
      notifyRefresh()
      router.refresh()
    } finally {
      setApproving(false)
    }
  }

  async function handleRegresar() {
    setRejecting(true)
    try {
      await changeStatus('rechazado')
    } finally {
      setRejecting(false)
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return
    setCancelling(true)
    try {
      const patches = cancelTarget === 'en_revision'
        ? { estatus: 'en_revision', motivo_cancelacion: cancelReason.trim() }
        : { estatus: 'cancelado', motivo_cancelacion: cancelReason.trim() }
      const res = await fetch(`/api/servicios/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patches),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast(err.error || 'Error al cancelar', 'error')
        return
      }
      setEstatus(cancelTarget)
      setCancelModal(false)
      setCancelReason('')
      toast(cancelTarget === 'en_revision' ? 'Cancelación enviada a revisión' : 'Servicio cancelado', 'success')
      notifyRefresh()
      router.refresh()
    } finally {
      setCancelling(false)
    }
  }

  async function handleCancelApprove() {
    setApprovingCancel(true)
    try {
      const res = await fetch(`/api/servicios/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estatus: 'cancelado' }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast(err.error || 'Error al confirmar cancelación', 'error')
        return
      }
      setEstatus('cancelado')
      toast('Servicio cancelado', 'success')
      notifyRefresh()
      router.refresh()
    } finally {
      setApprovingCancel(false)
    }
  }

  async function handleCancelRegresar() {
    setRejecting(true)
    try {
      const res = await fetch(`/api/servicios/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estatus: 'pendiente', motivo_cancelacion: null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast(err.error || 'Error al regresar', 'error')
        return
      }
      setEstatus('pendiente')
      toast('Servicio regresado a pendiente', 'success')
      notifyRefresh()
      router.refresh()
    } finally {
      setRejecting(false)
    }
  }

  const isApproved = !!service.approved_at
  const info = ESTATUS_MAP[estatus] ?? ESTATUS_MAP.pendiente
  const techs = service.technicians ?? []

  const isCancellationReview = estatus === 'en_revision' && !!service.motivo_cancelacion
  const isTerminationReview  = estatus === 'en_revision' && !service.motivo_cancelacion

  const showIniciar            = canChangeStatus && estatus === 'pendiente'
  const showPendingCancel      = canChangeStatus && estatus === 'pendiente'
  const showTerminar           = canChangeStatus && (estatus === 'en_curso' || estatus === 'rechazado')
  const showRevision           = canApprove && isTerminationReview
  const showCancellationReview = canApprove && isCancellationReview
  const showNoMaterials        = canApprove && isTerminationReview && !hasMaterials

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-3xl font-bold font-mono" style={{ color: 'var(--c-ink)' }}>
              {service.number}
            </h1>
            <span className={info.cls}>{info.label}</span>
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
            {service.motivo_cancelacion && (
              <div className="mt-1"><span style={{ color: 'var(--c-ghost)' }}>Motivo de cancelación:</span>{' '}
                <span style={{ color: 'var(--c-rose)' }}>{service.motivo_cancelacion}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {(showIniciar || showPendingCancel) && (
            <div className="flex gap-2">
              {showIniciar && (
                <button
                  onClick={() => changeStatus('en_curso')}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: saving ? 'var(--c-rim-hi)' : 'var(--c-navy)', cursor: saving ? 'not-allowed' : 'pointer', border: 'none', opacity: saving ? 0.6 : 1 }}
                >
                  Iniciar
                </button>
              )}
              {showPendingCancel && (
                <button
                  onClick={() => { setCancelTarget('en_revision'); setCancelModal(true) }}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{ background: 'transparent', cursor: saving ? 'not-allowed' : 'pointer', border: '1px solid var(--c-rim-hi)', color: 'var(--c-ghost)', opacity: saving ? 0.6 : 1 }}
                >
                  Cancelar
                </button>
              )}
            </div>
          )}
          {showTerminar && (
            <button
              onClick={() => changeStatus('en_revision')}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: saving ? 'var(--c-rim-hi)' : 'var(--c-gold)', cursor: saving ? 'not-allowed' : 'pointer', border: 'none', opacity: saving ? 0.6 : 1 }}
            >
              Terminar
            </button>
          )}
        </div>
      </div>

      {showCancellationReview && (
        <div className="mb-8 rounded-xl p-5" style={{ border: '1px solid rgba(220,38,38,0.20)', background: 'var(--c-rose-bg)' }}>
          <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--c-rose)' }}>Solicitud de cancelación</h3>
          <p className="text-xs mb-1" style={{ color: 'var(--c-dim)' }}>Razón:</p>
          <p className="text-sm mb-4 font-medium" style={{ color: 'var(--c-ink)' }}>{service.motivo_cancelacion}</p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleCancelApprove}
              disabled={approvingCancel || rejecting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: approvingCancel ? 'var(--c-rim-hi)' : 'var(--c-rose)', cursor: approvingCancel ? 'not-allowed' : 'pointer', border: 'none', opacity: approvingCancel ? 0.6 : 1 }}
            >
              {approvingCancel ? 'Confirmando...' : 'Confirmar cancelación'}
            </button>
            <button
              onClick={handleCancelRegresar}
              disabled={approvingCancel || rejecting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'transparent', cursor: rejecting ? 'not-allowed' : 'pointer', border: '1px solid var(--c-rim-hi)', color: 'var(--c-dim)', opacity: rejecting ? 0.6 : 1 }}
            >
              {rejecting ? 'Regresando...' : 'Regresar'}
            </button>
          </div>
        </div>
      )}

      {showRevision && (
        <div className="mb-8 rounded-xl p-5" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
          <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--c-ink)' }}>Revisión del servicio</h3>
          <p className="text-xs mb-4" style={{ color: 'var(--c-dim)' }}>
            Aprobar genera una nota de venta con los materiales registrados. Regresar devuelve el servicio a los técnicos.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleApprove}
              disabled={approving || rejecting || !hasMaterials}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: approving || !hasMaterials ? 'var(--c-rim-hi)' : 'var(--c-mint)', cursor: approving || !hasMaterials ? 'not-allowed' : 'pointer', border: 'none', opacity: approving || !hasMaterials ? 0.6 : 1, boxShadow: hasMaterials ? '0 2px 8px rgba(5,150,105,0.20)' : 'none' }}
            >
              {approving ? 'Aprobando...' : 'Aprobar'}
            </button>
            <button
              onClick={handleRegresar}
              disabled={approving || rejecting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'transparent', cursor: rejecting ? 'not-allowed' : 'pointer', border: '1px solid var(--c-rose)', color: 'var(--c-rose)', opacity: rejecting ? 0.6 : 1 }}
            >
              {rejecting ? 'Regresando...' : 'Regresar'}
            </button>
            <button
              onClick={() => { setCancelTarget('cancelado'); setCancelModal(true) }}
              disabled={approving || rejecting}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'transparent', cursor: 'pointer', border: '1px solid var(--c-rim-hi)', color: 'var(--c-ghost)' }}
            >
              Cancelar
            </button>
          </div>
          {showNoMaterials && (
            <p className="text-xs mt-3" style={{ color: 'var(--c-rose)' }}>
              Registra materiales antes de aprobar.
            </p>
          )}
        </div>
      )}

      {(canEditReport || reporte || comentariosReporte) && (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className={labelCls} style={labelStyle}>Reporte técnico</label>
            {canEditReport ? (
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
            {canEditReport ? (
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
            Servicio terminado
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

      {cancelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => { setCancelModal(false); setCancelReason('') }}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl flex flex-col overflow-hidden"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)', boxShadow: '0 8px 32px rgba(9,11,16,0.24)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <h2 className="font-heading text-base font-bold" style={{ color: 'var(--c-ink)' }}>
                {cancelTarget === 'en_revision' ? 'Solicitar cancelación' : 'Cancelar servicio'}
              </h2>
              <button
                type="button"
                onClick={() => { setCancelModal(false); setCancelReason('') }}
                className="rounded-lg p-1.5 transition-colors hover:opacity-70"
                style={{ color: 'var(--c-dim)', cursor: 'pointer', background: 'transparent', border: 'none' }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                  <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--c-dim)' }}>
                  Razón de cancelación
                </label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  rows={3}
                  placeholder="Describe el motivo de cancelación..."
                  className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
                  style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }}
                  autoFocus
                />
              </div>
              <div className="flex gap-3" style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => { setCancelModal(false); setCancelReason('') }}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold transition-colors hover:opacity-75"
                  style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)', cursor: 'pointer' }}
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling || !cancelReason.trim()}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{
                    background: cancelling || !cancelReason.trim() ? 'var(--c-rim-hi)' : 'var(--c-rose)',
                    cursor: cancelling || !cancelReason.trim() ? 'not-allowed' : 'pointer',
                    border: 'none',
                    opacity: cancelling || !cancelReason.trim() ? 0.6 : 1,
                  }}
                >
                  {cancelling ? 'Enviando...' : cancelTarget === 'en_revision' ? 'Enviar a revisión' : 'Confirmar cancelación'}
                </button>
              </div>
            </div>
          </div>
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
