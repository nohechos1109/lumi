'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ServiceOrder, ServiceOrderEstatus, Service } from '@/lib/queries/servicios'
import { notifyRefresh, toast } from '@/lib/toast'
import DateTimeRangePicker from '@/components/ui/DateTimeRangePicker'

const ESTATUS_MAP: Record<string, { label: string; cls: string }> = {
  borrador:  { label: 'Borrador',  cls: 'badge badge-pending' },
  pendiente: { label: 'Pendiente', cls: 'badge badge-pending' },
  agendado:  { label: 'Agendado',  cls: 'badge badge-scheduled' },
  en_curso:  { label: 'En curso',  cls: 'badge badge-in-progress' },
  terminado: { label: 'Terminado', cls: 'badge badge-done' },
  atendido:  { label: 'Atendido',  cls: 'badge badge-attended' },
  cancelado: { label: 'Cancelado', cls: 'badge badge-rejected' },
}

const inp = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }
const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }

interface Props {
  order: ServiceOrder
  services: Service[]
  canManage: boolean
  canCancel: boolean
  orderTechs: { user_id: string; username?: string }[]
  allTecnicos: { id: string; username: string }[]
}

export default function OrderEditor({ order, services, canManage, canCancel, orderTechs, allTecnicos }: Props) {
  const router = useRouter()
  const [estatus, setEstatus] = useState<ServiceOrderEstatus>(order.estatus)
  const [saving, setSaving] = useState(false)

  // Editable field states (borrador mode)
  const [motivo, setMotivo] = useState(order.motivo_del_servicio ?? '')
  const [tipoLugar, setTipoLugar] = useState<'calle' | 'taller' | ''>(order.tipo_lugar ?? '')
  const [ubicacion, setUbicacion] = useState(order.ubicacion ?? '')
  const [comentarios, setComentarios] = useState(order.comentarios_de_soporte ?? '')
  const [fechaAgendada, setFechaAgendada] = useState(order.fecha_hora_agendada ?? '')
  const [fechaLimite, setFechaLimite] = useState(order.fecha_hora_limite ?? '')

  // Technician assignment state
  const [assignAll, setAssignAll] = useState(order.assign_all_technicians ?? false)
  const [selectedTechs, setSelectedTechs] = useState<Set<string>>(
    new Set(orderTechs.map(t => t.user_id))
  )
  const [techSaving, setTechSaving] = useState(false)

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  const isDraft = estatus === 'borrador' || estatus === 'pendiente'
  const isLocked = estatus === 'terminado' || estatus === 'cancelado' || estatus === 'atendido'
  const canEdit = canManage && isDraft

  const allComplete = services.length > 0 && services.every(s =>
    ['terminado', 'cancelado', 'atendido'].includes(s.estatus)
  )

  const missingRequired: string[] = []
  if (!motivo.trim()) missingRequired.push('Motivo')
  if (!ubicacion.trim()) missingRequired.push('Ubicación')
  if (!tipoLugar) missingRequired.push('Tipo de lugar')
  if (!fechaAgendada) missingRequired.push('Fecha agendada')
  if (!assignAll && selectedTechs.size === 0) missingRequired.push('Técnicos')
  const canLeaveBorrador = missingRequired.length === 0

  const info = ESTATUS_MAP[estatus] ?? ESTATUS_MAP.borrador
  const techs = orderTechs

  async function patch(data: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch(`/api/servicios/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast(err.error || 'Error al guardar', 'error')
        return false
      }
      return true
    } finally {
      setSaving(false)
    }
  }

  async function saveField(field: string, value: unknown) {
    const ok = await patch({ [field]: value || null })
    if (ok) { notifyRefresh(); router.refresh() }
  }

  async function changeStatus(next: ServiceOrderEstatus) {
    const ok = await patch({ estatus: next })
    if (ok) {
      setEstatus(next)
      toast('Estado actualizado', 'success')
      notifyRefresh()
      router.refresh()
    }
  }

  async function handleCancel() {
    if (!cancelReason.trim()) return
    setCancelling(true)
    try {
      const res = await fetch(`/api/servicios/orders/${order.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: cancelReason.trim() }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(result.error || 'Error al cancelar', 'error')
        return
      }
      setEstatus('cancelado')
      setCancelModal(false)
      setCancelReason('')
      toast('Orden cancelada', 'success')
      notifyRefresh()
      router.refresh()
    } finally {
      setCancelling(false)
    }
  }

  async function toggleAssignAll() {
    const next = !assignAll
    setTechSaving(true)
    try {
      const res = await fetch(`/api/servicios/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assign_all_technicians: next }),
      })
      if (res.ok) {
        setAssignAll(next)
        notifyRefresh()
        router.refresh()
      } else {
        toast('Error al guardar', 'error')
      }
    } finally {
      setTechSaving(false)
    }
  }

  async function toggleTechnician(userId: string) {
    const isSelected = selectedTechs.has(userId)
    setTechSaving(true)
    try {
      let res: Response
      if (isSelected) {
        res = await fetch(`/api/servicios/orders/${order.id}/technicians?user_id=${userId}`, { method: 'DELETE' })
      } else {
        res = await fetch(`/api/servicios/orders/${order.id}/technicians`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        })
      }
      if (res.ok) {
        setSelectedTechs(prev => {
          const next = new Set(prev)
          if (isSelected) next.delete(userId)
          else next.add(userId)
          return next
        })
        notifyRefresh()
        router.refresh()
      } else {
        toast('Error al guardar', 'error')
      }
    } finally {
      setTechSaving(false)
    }
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--c-ink)' }}>
              {order.motivo_del_servicio || 'Sin motivo'}
            </h1>
            <span className={info.cls}>{info.label}</span>
          </div>
          <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--c-ghost)', letterSpacing: '0.08em' }}>
            {order.number}
          </p>

          {/* Read-only info (non-borrador states) */}
          {!canEdit && (
            <div className="text-sm mt-3 space-y-1" style={{ color: 'var(--c-dim)' }}>
              {order.customer_name && <div><span style={{ color: 'var(--c-ghost)' }}>Cliente:</span> {order.customer_name}</div>}
              {order.tipo_lugar && (
                <div>
                  <span style={{ color: 'var(--c-ghost)' }}>Lugar:</span>{' '}
                  <span className={`badge badge-${order.tipo_lugar}`}>{order.tipo_lugar === 'taller' ? 'Taller' : 'Calle'}</span>
                </div>
              )}
              {order.ubicacion && (
                <div>
                  <span style={{ color: 'var(--c-ghost)' }}>Ubicación:</span>{' '}
                  {/^https?:\/\//.test(order.ubicacion) ? (
                    <a href={order.ubicacion} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>{order.ubicacion}</a>
                  ) : order.ubicacion}
                </div>
              )}
              {order.comentarios_de_soporte && <div><span style={{ color: 'var(--c-ghost)' }}>Comentarios:</span> {order.comentarios_de_soporte}</div>}
              {(order.assign_all_technicians || techs.length > 0) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ color: 'var(--c-ghost)' }}>Técnicos:</span>
                  {order.assign_all_technicians && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}>
                      Todos
                    </span>
                  )}
                  {techs.map(t => (
                    <span key={t.user_id} className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}>
                      {t.username}
                    </span>
                  ))}
                </div>
              )}
              {order.fecha_hora_agendada && (
                <div suppressHydrationWarning>
                  <span style={{ color: 'var(--c-ghost)' }}>Agendada:</span>{' '}
                  {new Date(order.fecha_hora_agendada).toLocaleString('es-MX')}
                </div>
              )}
              {order.fecha_hora_limite && (
                <div suppressHydrationWarning>
                  <span style={{ color: 'var(--c-ghost)' }}>Límite:</span>{' '}
                  {new Date(order.fecha_hora_limite).toLocaleString('es-MX')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {canManage && !isLocked && (
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {isDraft && (
              <button
                onClick={() => changeStatus('agendado')}
                disabled={saving || !canLeaveBorrador}
                title={!canLeaveBorrador ? `Falta: ${missingRequired.join(', ')}` : undefined}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: saving || !canLeaveBorrador ? 'var(--c-rim-hi)' : 'var(--c-navy)',
                  cursor: saving || !canLeaveBorrador ? 'not-allowed' : 'pointer',
                  border: 'none',
                  opacity: saving || !canLeaveBorrador ? 0.6 : 1,
                }}
              >
                Agendar
              </button>
            )}
            {estatus === 'agendado' && (
              <>
                {canCancel && (
                  <button
                    onClick={() => changeStatus('borrador')}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'transparent', cursor: saving ? 'not-allowed' : 'pointer', border: '1px solid var(--c-rim-hi)', color: 'var(--c-dim)', opacity: saving ? 0.6 : 1 }}
                  >
                    Modificar
                  </button>
                )}
                <button
                  onClick={() => changeStatus('en_curso')}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: saving ? 'var(--c-rim-hi)' : 'var(--c-navy)', cursor: saving ? 'not-allowed' : 'pointer', border: 'none', opacity: saving ? 0.6 : 1 }}
                >
                  Iniciar
                </button>
              </>
            )}
            {estatus === 'en_curso' && (
              <button
                onClick={() => allComplete && changeStatus('terminado')}
                disabled={saving || !allComplete}
                title={!allComplete ? 'Todos los servicios deben estar terminados o cancelados' : undefined}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ background: saving || !allComplete ? 'var(--c-rim-hi)' : 'var(--c-mint)', cursor: saving || !allComplete ? 'not-allowed' : 'pointer', border: 'none', opacity: saving || !allComplete ? 0.6 : 1 }}
              >
                Terminar
              </button>
            )}
            {canCancel && (isDraft || estatus === 'agendado' || estatus === 'en_curso') && (
              <button
                onClick={() => setCancelModal(true)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'transparent', cursor: 'pointer', border: '1px solid var(--c-rim-hi)', color: 'var(--c-ghost)' }}
              >
                Cancelar
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Borrador required-fields banner ── */}
      {canEdit && !canLeaveBorrador && (
        <div
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: 'var(--c-gold-bg)', border: '1px solid var(--c-gold-bd)', color: 'var(--c-gold)' }}
        >
          Para agendar la orden completa: <strong>{missingRequired.join(', ')}</strong>.
        </div>
      )}

      {/* ── Edit form (borrador only) ── */}
      {canEdit && (
        <div className="mb-8 grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelCls} style={labelStyle}>Motivo del servicio</label>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              onBlur={() => saveField('motivo_del_servicio', motivo)}
              rows={3}
              className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
              style={inp}
            />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Comentarios de soporte</label>
            <textarea
              value={comentarios}
              onChange={e => setComentarios(e.target.value)}
              onBlur={() => saveField('comentarios_de_soporte', comentarios)}
              rows={3}
              className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
              style={inp}
            />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Tipo de lugar</label>
            <select
              value={tipoLugar}
              onChange={e => { const v = e.target.value as 'calle' | 'taller' | ''; setTipoLugar(v); saveField('tipo_lugar', v || null) }}
              className="w-full text-sm rounded-xl px-4 py-2.5"
              style={inp}
            >
              <option value="">Sin especificar</option>
              <option value="taller">Taller</option>
              <option value="calle">Calle</option>
            </select>
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Ubicación</label>
            <input
              type="text"
              value={ubicacion}
              onChange={e => setUbicacion(e.target.value)}
              onBlur={() => saveField('ubicacion', ubicacion)}
              placeholder="Dirección o enlace de Google Maps"
              className="w-full text-sm rounded-xl px-4 py-2.5"
              style={inp}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls} style={labelStyle}>Fecha y hora agendada → límite</label>
            <DateTimeRangePicker
              initialStart={fechaAgendada}
              initialEnd={fechaLimite}
              onChange={(startIso, endIso) => {
                const a = startIso ? new Date(startIso).toISOString() : null
                const l = endIso ? new Date(endIso).toISOString() : null
                if (a !== fechaAgendada || l !== fechaLimite) {
                  setFechaAgendada(a ?? '')
                  setFechaLimite(l ?? '')
                  patch({ fecha_hora_agendada: a, fecha_hora_limite: l }).then(ok => {
                    if (ok) { notifyRefresh(); router.refresh() }
                  })
                }
              }}
            />
          </div>
          {/* Technician picker */}
          {allTecnicos.length > 0 && (
            <div className="md:col-span-2">
              <label className={labelCls} style={labelStyle}>Técnicos asignados</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={techSaving}
                  onClick={toggleAssignAll}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: assignAll ? 'var(--c-navy)' : 'transparent',
                    color: assignAll ? '#fff' : 'var(--c-dim)',
                    border: assignAll ? 'none' : '1px solid var(--c-rim-hi)',
                    cursor: techSaving ? 'not-allowed' : 'pointer',
                    opacity: techSaving ? 0.6 : 1,
                  }}
                >
                  Todos
                </button>
                {allTecnicos.map(t => {
                  const active = selectedTechs.has(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={techSaving}
                      onClick={() => toggleTechnician(t.id)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: active ? 'var(--c-navy)' : 'transparent',
                        color: active ? '#fff' : 'var(--c-dim)',
                        border: active ? 'none' : '1px solid var(--c-rim-hi)',
                        cursor: techSaving ? 'not-allowed' : 'pointer',
                        opacity: techSaving ? 0.6 : 1,
                      }}
                    >
                      {t.username}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── En curso: Terminar blocked notice ── */}
      {estatus === 'en_curso' && canManage && !allComplete && (
        <div className="mb-6 rounded-xl px-4 py-3 text-sm" style={{ background: 'var(--c-gold-bg)', border: '1px solid var(--c-gold-bd)', color: 'var(--c-gold)' }}>
          Todos los servicios deben estar terminados o cancelados para poder terminar la orden.
          {services.length === 0 && ' No hay servicios registrados.'}
        </div>
      )}

      {/* ── Cancel modal ── */}
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
                Cancelar orden
              </h2>
              <button
                type="button"
                onClick={() => { setCancelModal(false); setCancelReason('') }}
                className="rounded-lg p-1.5 hover:opacity-70"
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
                  placeholder="Describe el motivo..."
                  className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
                  style={inp}
                  autoFocus
                />
              </div>
              <div className="flex gap-3" style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => { setCancelModal(false); setCancelReason('') }}
                  className="flex-1 py-2 rounded-lg text-sm font-semibold hover:opacity-75"
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
                  {cancelling ? 'Cancelando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
