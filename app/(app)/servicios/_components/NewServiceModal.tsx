'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import CustomerSearchSelect from '@/components/ui/CustomerSearchSelect'
import { notifyRefresh, toast } from '@/lib/toast'

interface Customer {
  id: string
  name: string
  companies: { id: string; name: string }[]
}

interface Unidad {
  id: string
  name: string
  empresa_id: string | null
  dueno_id: string | null
}

interface Props {
  onClose: () => void
  prefillOrderId?: string
  prefillCustomerId?: string | null
  prefillTipoLugar?: 'calle' | 'taller' | null
  prefillMotivo?: string | null
}

const labelCls = 'block text-xs font-semibold mb-1.5'
const labelStyle = { color: 'var(--c-dim)' }
const inp = { background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }

export default function NewServiceModal({ onClose, prefillOrderId, prefillCustomerId, prefillTipoLugar, prefillMotivo }: Props) {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [unidades, setUnidades] = useState<Unidad[]>([])
  const [customerId, setCustomerId] = useState(prefillCustomerId ?? '')
  const [unidadId, setUnidadId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!prefillOrderId) {
      fetch('/api/customers').then(r => r.json()).then(setCustomers).catch(() => {})
    }
    fetch('/api/unidades').then(r => r.json()).then(setUnidades).catch(() => {})
  }, [prefillOrderId])

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
    setLoading(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/servicios/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_order_id: prefillOrderId ?? null,
          customer_id: walkIn ? customerId : null,
          unidad_id: unidadId || null,
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
      router.push(`/servicios/services/${result.id}`)
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
            <label className={labelCls} style={labelStyle}>Unidad (opcional)</label>
            <select
              value={unidadId}
              onChange={e => setUnidadId(e.target.value)}
              className="w-full text-sm rounded-xl px-4 py-2.5"
              style={inp}
            >
              <option value="">Sin unidad</option>
              {unidades.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
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
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                    background: prefillTipoLugar === 'taller' ? '#E0F2FE' : '#FEF3C7',
                    color: prefillTipoLugar === 'taller' ? '#0369A1' : '#B45309',
                  }}>{prefillTipoLugar === 'taller' ? 'Taller' : 'Calle'}</span>
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
            <input
              name="fecha_hora_agendada"
              type="datetime-local"
              className="w-full text-sm rounded-xl px-4 py-2.5"
              style={inp}
            />
          </div>

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
