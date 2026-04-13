'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast, notifyRefresh } from '@/lib/toast'
import { QuoteState } from '@/lib/queries/quotes'

interface Props {
  quoteId: string
  currentStatus: QuoteState
  role: string
  isShowroom?: boolean
}

interface Ruta { id: string; name: string; cliente_id: string | null }
interface Customer { id: string; name: string; companies: { id: string; name: string }[] }

const QUOTE_STATUSES: { value: QuoteState; label: string }[] = [
  { value: 'draft',     label: 'Borrador' },
  { value: 'sent',      label: 'Enviada' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'expired',   label: 'Expirada' },
  { value: 'cancelled', label: 'Cancelada' },
]

export default function QuoteStatusEditor({ quoteId, currentStatus, role, isShowroom = false }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rutaDialog, setRutaDialog] = useState<{ projectId: string; projectName: string; customerId: string } | null>(null)
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedRuta, setSelectedRuta] = useState('')
  const [savingRuta, setSavingRuta] = useState(false)

  useEffect(() => {
    if (rutaDialog) {
      fetch('/api/rutas').then(r => r.json()).then(d => setRutas(Array.isArray(d) ? d : []))
      fetch('/api/customers').then(r => r.json()).then(d => setCustomers(Array.isArray(d) ? d : []))
    }
  }, [rutaDialog])

  const availableRutas = useMemo(() => {
    if (!rutaDialog) return []
    const customer = customers.find(c => c.id === rutaDialog.customerId)
    if (!customer) return rutas
    const relatedIds = new Set([customer.id, ...customer.companies.map(co => co.id)])
    return rutas.filter(r => r.cliente_id && relatedIds.has(r.cliente_id))
  }, [rutas, customers, rutaDialog])

  // Determine allowed statuses based on role (mirroring API logic)
  const allowedTransitions: Record<string, QuoteState[]> = {
    sales:   ['sent', 'cancelled'],
    manager: ['confirmed', 'cancelled'],
    admin:   ['draft', 'sent', 'confirmed', 'cancelled', 'expired'],
  }

  const allowed = allowedTransitions[role] || []
  const isAllowed = (status: QuoteState) => status === currentStatus || allowed.includes(status)

  async function handleChange(newState: QuoteState) {
    if (newState === currentStatus) return
    setLoading(true)
    try {
      const r = await fetch(`/api/quotes/${quoteId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState }),
      })
      if (r.status === 422) {
        const data = await r.json()
        if (data.error === 'RUTA_REQUIRED') {
          setSelectedRuta('')
          setRutaDialog({ projectId: data.projectId, projectName: data.projectName, customerId: data.customerId })
          return
        }
      }
      if (!r.ok) throw new Error()
      notifyRefresh()
      toast('Estado de la cotización actualizado')
      router.refresh()
    } catch {
      toast('Error al actualizar el estado', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAssignRutaAndConfirm() {
    if (!rutaDialog || !selectedRuta) return
    setSavingRuta(true)
    try {
      const r = await fetch(`/api/projects/${rutaDialog.projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruta_id: selectedRuta }),
      })
      if (!r.ok) throw new Error('Error al asignar ruta')
      setRutaDialog(null)
      await handleChange('confirmed')
    } catch {
      toast('Error al asignar la ruta', 'error')
    } finally {
      setSavingRuta(false)
    }
  }

  const badgeColors: Record<string, { bg: string; text: string }> = {
    draft:     { bg: '#FEF9EC',           text: '#B45309' },
    sent:      { bg: 'var(--c-sky-bg)',   text: 'var(--c-sky)' },
    confirmed: { bg: 'var(--c-mint-bg)', text: 'var(--c-mint)' },
    cancelled: { bg: 'var(--c-rose-bg)', text: 'var(--c-rose)' },
    expired:   { bg: 'var(--c-base)',    text: 'var(--c-ghost)' },
  }

  const showBadge = !(isShowroom && currentStatus === 'draft')
  const canSend = currentStatus === 'draft' && allowed.includes('sent')
  const canConfirm = currentStatus === 'sent' && allowed.includes('confirmed')
  const canCancel = (currentStatus === 'draft' || currentStatus === 'sent' || currentStatus === 'confirmed') && allowed.includes('cancelled')

  return (
    <>
    {/* Ruta required dialog */}
    {rutaDialog && (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
        <div className="rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 shadow-xl" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
          <div>
            <h3 className="font-heading text-lg font-bold" style={{ color: 'var(--c-ink)' }}>Ruta requerida</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
              El proyecto <strong style={{ color: 'var(--c-ink)' }}>{rutaDialog.projectName}</strong> no tiene una ruta asignada.
              Selecciona una ruta para poder confirmar la cotización.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>Ruta</label>
            {availableRutas.length === 0 && customers.length > 0 ? (
              <p className="text-sm italic" style={{ color: 'var(--c-ghost)' }}>
                Sin rutas disponibles para este cliente. Crea una ruta vinculada al cliente primero.
              </p>
            ) : (
              <select
                value={selectedRuta}
                onChange={e => setSelectedRuta(e.target.value)}
                className="text-sm rounded-lg px-3 py-2.5"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
              >
                <option value="">Seleccionar ruta...</option>
                {availableRutas.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setRutaDialog(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
              style={{ border: '1px solid var(--c-rim)', color: 'var(--c-ghost)' }}
            >Cancelar</button>
            <button
              onClick={handleAssignRutaAndConfirm}
              disabled={!selectedRuta || savingRuta || availableRutas.length === 0}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
              style={{ background: '#059669', color: '#fff' }}
            >{savingRuta ? '...' : 'Asignar y Confirmar'}</button>
          </div>
        </div>
      </div>
    )}
    <div className="flex items-center gap-3">
      {isShowroom && (
        <span
          className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
          style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
        >
          Mostrador
        </span>
      )}
      {showBadge && (
        <div className="flex items-center gap-2 mr-2">
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--c-ghost)' }}>
            Estatus:
          </span>
          <span
            className="text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
            style={{
              background: badgeColors[currentStatus]?.bg || 'var(--c-base)',
              color: badgeColors[currentStatus]?.text || 'var(--c-dim)',
              border: `1px solid ${badgeColors[currentStatus]?.text || 'var(--c-dim)'}40`
            }}
          >
            {QUOTE_STATUSES.find(x => x.value === currentStatus)?.label || currentStatus}
          </span>
        </div>
      )}

      {canSend && (
        <button
          disabled={loading}
          onClick={() => handleChange('sent')}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:opacity-85 shadow-sm active:scale-95 disabled:opacity-50"
          style={{ background: 'var(--c-navy)', color: '#FFFFFF' }}
        >
          {loading ? '...' : 'Enviar'}
        </button>
      )}

      {canConfirm && (
        <button
          disabled={loading}
          onClick={() => {
            if (confirm('¿Confirmar esta cotización? Se generará una venta automáticamente.')) handleChange('confirmed')
          }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:opacity-85 shadow-sm active:scale-95 disabled:opacity-50"
          style={{ background: '#059669', color: '#FFFFFF' }}
        >
          {loading ? '...' : 'Confirmar'}
        </button>
      )}

      {canCancel && (
        <button
          disabled={loading}
          onClick={() => {
            if (confirm('¿Seguro que deseas cancelar esta cotización?')) handleChange('cancelled')
          }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:bg-rose-50 active:scale-95 disabled:opacity-50"
          style={{ color: 'var(--c-rose)', border: '1px solid var(--c-rose-bg)', background: 'transparent' }}
        >
          {loading ? '...' : 'Cancelar'}
        </button>
      )}

      {loading && !canSend && !canConfirm && !canCancel && <span className="animate-spin text-xs">⏳</span>}
    </div>
    </>
  )
}
