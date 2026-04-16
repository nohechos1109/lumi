'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

const ESTATUS_MAP: Record<string, { bg: string; text: string }> = {
  pendiente: { bg: '#F1F5F9', text: '#475569' },
  agendado:  { bg: '#E0F2FE', text: '#0369A1' },
  en_curso:  { bg: '#FEF3C7', text: '#B45309' },
  atendido:  { bg: '#DCFCE7', text: '#15803D' },
  cancelado: { bg: '#FFE4E6', text: '#BE123C' },
  rechazado: { bg: '#FEE2E2', text: '#991B1B' },
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
}

export default function ServiceEditor({ service, canEdit, canManageTech, canApprove, hasMaterials, tecnicos }: Props) {
  const router = useRouter()
  const [estatus, setEstatus] = useState<ServiceEstatus>(service.estatus)
  const [reporte, setReporte] = useState(service.reporte_tecnico ?? '')
  const [comentariosReporte, setComentariosReporte] = useState(service.comentarios_reporte ?? '')
  const [saving, setSaving] = useState(false)
  const [newTechId, setNewTechId] = useState('')
  const [approving, setApproving] = useState(false)

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

  async function assignTech() {
    if (!newTechId) return
    const res = await fetch(`/api/servicios/services/${service.id}/technicians`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: newTechId }),
    })
    if (!res.ok) {
      toast('Error al asignar técnico', 'error')
      return
    }
    toast('Técnico asignado', 'success')
    setNewTechId('')
    router.refresh()
  }

  async function removeTech(userId: string) {
    const res = await fetch(`/api/servicios/services/${service.id}/technicians?user_id=${userId}`, {
      method: 'DELETE',
    })
    if (!res.ok) {
      toast('Error al remover técnico', 'error')
      return
    }
    toast('Técnico removido', 'success')
    router.refresh()
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

  const st = ESTATUS_MAP[estatus] ?? ESTATUS_MAP.pendiente
  const assignedIds = new Set((service.technicians ?? []).map(t => t.user_id))
  const available = tecnicos.filter(t => !assignedIds.has(t.id))

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-3xl font-bold font-mono" style={{ color: 'var(--c-ink)' }}>
              {service.number}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.text }}>
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
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                  background: service.tipo_lugar === 'taller' ? '#E0F2FE' : '#FEF3C7',
                  color: service.tipo_lugar === 'taller' ? '#0369A1' : '#B45309',
                }}>{service.tipo_lugar === 'taller' ? 'Taller' : 'Calle'}</span>
              </div>
            )}
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

      {canEdit && (
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className={labelCls} style={labelStyle}>Reporte técnico</label>
            <textarea
              value={reporte}
              onChange={e => setReporte(e.target.value)}
              onBlur={() => saveField('reporte_tecnico', reporte || null)}
              rows={5}
              className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
              style={inp}
            />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Comentarios del técnico</label>
            <textarea
              value={comentariosReporte}
              onChange={e => setComentariosReporte(e.target.value)}
              onBlur={() => saveField('comentarios_reporte', comentariosReporte || null)}
              rows={5}
              className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
              style={inp}
            />
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--c-ghost)' }}>
          Técnicos asignados
        </h2>
        {(service.technicians ?? []).length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--c-dim)' }}>Sin técnicos asignados.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {service.technicians!.map(t => (
              <li
                key={t.user_id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{ background: 'var(--c-panel)', color: 'var(--c-ink)', border: '1px solid var(--c-rim)' }}
              >
                {t.username}
                {canManageTech && (
                  <button
                    onClick={() => removeTech(t.user_id)}
                    className="opacity-60 hover:opacity-100"
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#991B1B' }}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {canManageTech && available.length > 0 && (
          <div className="flex gap-2 mt-4">
            <select
              value={newTechId}
              onChange={e => setNewTechId(e.target.value)}
              className="text-sm rounded-lg px-3 py-2"
              style={inp}
            >
              <option value="">Seleccionar técnico...</option>
              {available.map(t => <option key={t.id} value={t.id}>{t.username}</option>)}
            </select>
            <button
              onClick={assignTech}
              disabled={!newTechId}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: newTechId ? '#B45309' : 'var(--c-rim-hi)', cursor: newTechId ? 'pointer' : 'not-allowed', border: 'none' }}
            >
              Asignar
            </button>
          </div>
        )}
      </div>

      {/* Approval section */}
      {isApproved && (
        <div className="mt-8 rounded-xl p-4" style={{ background: '#DCFCE7', border: '1px solid #BBF7D0' }}>
          <p className="text-sm font-semibold" style={{ color: '#15803D' }}>
            Servicio aprobado
            {service.sale_note_id && (
              <span className="ml-2 font-normal" style={{ color: '#166534' }}>
                — Nota generada
              </span>
            )}
          </p>
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
            className="px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: approving ? 'var(--c-rim-hi)' : '#15803D', cursor: approving ? 'not-allowed' : 'pointer', border: 'none', opacity: approving ? 0.6 : 1 }}
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
    </div>
  )
}
