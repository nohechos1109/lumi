'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import CustomerSearchSelect from '@/components/ui/CustomerSearchSelect'
import UnidadSearchSelect from '@/components/ui/UnidadSearchSelect'
import SingleDateTimePicker from '@/components/ui/SingleDateTimePicker'
import { notifyRefresh, toast } from '@/lib/toast'

interface Customer {
  id: string
  name: string
  companies: { id: string; name: string }[]
}

interface Props {
  onClose: () => void
  prefillOrderId?: string
  prefillCustomerId?: string | null
  prefillTipoLugar?: 'calle' | 'taller' | null
  prefillMotivo?: string | null
  compact?: boolean
  canCreateUnit?: boolean
}

const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }
const inp = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }

export default function NewServiceModal({ onClose, prefillOrderId, prefillCustomerId, prefillTipoLugar, prefillMotivo, compact, canCreateUnit }: Props) {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState(prefillCustomerId ?? '')
  const [unidadId, setUnidadId] = useState('')
  const [unidadMode, setUnidadMode] = useState<'select' | 'new'>('select')
  const [newUnitName, setNewUnitName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!prefillOrderId) {
      const qs = unidadId ? `?unidad_id=${unidadId}` : ''
      fetch(`/api/customers${qs}`).then(r => r.json()).then(setCustomers).catch(() => {})
    }
  }, [prefillOrderId, unidadId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const walkIn = !prefillOrderId
    if (walkIn && !customerId) {
      toast('Selecciona un cliente para walk-in', 'error')
      return
    }
    if (unidadMode === 'select' && !unidadId) {
      toast('Unidad requerida', 'error')
      return
    }
    if (unidadMode === 'new' && !newUnitName.trim()) {
      toast('Nombre de unidad requerido', 'error')
      return
    }
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      let finalUnidadId = unidadId
      if (unidadMode === 'new') {
        const unitRes = await fetch('/api/unidades', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newUnitName.trim(), empresa_id: customerId || null }),
        })
        if (!unitRes.ok) {
          const err = await unitRes.json().catch(() => ({}))
          toast(err.error || 'Error al crear unidad', 'error')
          return
        }
        const newUnit = await unitRes.json()
        finalUnidadId = newUnit.id
      }

      const res = await fetch('/api/servicios/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_order_id: prefillOrderId ?? null,
          customer_id: walkIn ? customerId : null,
          unidad_id: finalUnidadId || null,
          motivo_visita: form.get('motivo_visita') || null,
          ubicacion_txt: form.get('ubicacion_txt') || null,
          comentarios_soporte: form.get('comentarios_soporte') || null,
          tipo_lugar: form.get('tipo_lugar') || null,
          fecha_hora_agendada: form.get('fecha_hora_agendada') || null,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast(result.error || 'Error al crear el servicio', 'error')
        return
      }
      toast('Servicio creado', 'success')
      notifyRefresh()
      onClose()
      router.push(`/servicios/services/${result.id}${unidadMode === 'new' ? '?new_unit=1' : ''}`)
    } finally {
      setLoading(false)
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
        className="w-full max-w-lg rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--c-rim)' }}>
          <div>
            <h2 className="font-heading text-xl font-bold" style={{ color: 'var(--c-ink)', letterSpacing: '0.03em' }}>
              Nuevo Servicio
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
              {prefillOrderId ? 'Agregar servicio a orden existente' : 'Walk-in — servicio sin proyecto previo'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:opacity-70"
            style={{ color: 'var(--c-dim)', cursor: 'pointer', background: 'transparent', border: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-5">
          {!prefillOrderId && (
            <div>
              <label className={labelCls} style={labelStyle}>Cliente *</label>
              <CustomerSearchSelect
                customers={customers}
                value={customerId}
                onChange={setCustomerId}
              />
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelCls} style={{ ...labelStyle, marginBottom: 0 }}>Unidad *</label>
              {unidadMode === 'new' ? (
                <button
                  type="button"
                  onClick={() => { setUnidadMode('select'); setNewUnitName('') }}
                  className="text-xs hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--c-ghost)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                  Seleccionar existente
                </button>
              ) : null}
            </div>
            {unidadMode === 'select' ? (
              <UnidadSearchSelect
                value={unidadId}
                onChange={setUnidadId}
                customerId={customerId || null}
                onNewUnit={canCreateUnit ? () => setUnidadMode('new') : undefined}
              />
            ) : (
              <input
                type="text"
                value={newUnitName}
                onChange={e => setNewUnitName(e.target.value)}
                placeholder="Nombre de la unidad (ej. VW Transporter BCD-1234)"
                className="w-full text-sm rounded-xl px-4 py-2.5"
                style={inp}
                autoFocus
              />
            )}
          </div>

          <div>
            <label className={labelCls} style={labelStyle}>Motivo de la visita *</label>
            <input
              name="motivo_visita"
              type="text"
              required
              defaultValue={prefillMotivo ?? ''}
              placeholder="Ej. Instalación de dashcam"
              className="w-full text-sm rounded-xl px-4 py-2.5"
              style={inp}
            />
          </div>

          <details open={!compact} className="group">
            <summary
              className="text-xs font-bold uppercase tracking-widest cursor-pointer select-none py-1"
              style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}
            >
              Más opciones
            </summary>
            <div className="flex flex-col gap-5 mt-3">
              <div>
                <label className={labelCls} style={labelStyle}>Ubicación (opcional)</label>
                <input
                  name="ubicacion_txt"
                  type="text"
                  placeholder="Dirección o referencia"
                  className="w-full text-sm rounded-xl px-4 py-2.5"
                  style={inp}
                />
              </div>

              <div>
                <label className={labelCls} style={labelStyle}>Detalles (opcional)</label>
                <textarea
                  name="comentarios_soporte"
                  rows={2}
                  placeholder="Indicaciones o detalles adicionales..."
                  className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
                  style={inp}
                />
              </div>

              <div>
                <label className={labelCls} style={labelStyle}>Tipo de lugar</label>
                {prefillTipoLugar ? (
                  <>
                    <input type="hidden" name="tipo_lugar" value={prefillTipoLugar} />
                    <div className="w-full text-sm rounded-xl px-4 py-2.5" style={{ ...inp, opacity: 0.7 }}>
                      <span className={`badge badge-${prefillTipoLugar}`}>{prefillTipoLugar === 'taller' ? 'Taller' : 'Calle'}</span>
                      <span className="ml-2 text-xs" style={{ color: 'var(--c-ghost)' }}>Heredado de la orden</span>
                    </div>
                  </>
                ) : (
                  <select name="tipo_lugar" className="w-full text-sm rounded-xl px-4 py-2.5" style={inp}>
                    <option value="">— Seleccionar —</option>
                    <option value="calle">Calle</option>
                    <option value="taller">Taller</option>
                  </select>
                )}
              </div>

              <div>
                <label className={labelCls} style={labelStyle}>Fecha/Hora agendada (opcional)</label>
                <SingleDateTimePicker name="fecha_hora_agendada" placeholder="Seleccionar fecha y hora" />
              </div>
            </div>
          </details>

          <div className="flex gap-3" style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors hover:opacity-75"
              style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all text-white"
              style={{
                background: loading ? 'var(--c-rim-hi)' : 'var(--c-navy)',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Creando...' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
