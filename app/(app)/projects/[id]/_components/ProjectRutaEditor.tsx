'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast, notifyRefresh } from '@/lib/toast'

interface Ruta { id: string; name: string; cliente_id: string | null }
interface Customer { id: string; name: string; companies: { id: string; name: string }[] }

interface Props {
  projectId: string
  customerId: string
  currentRutaId: string | null
  currentRutaName: string | null
}

export default function ProjectRutaEditor({ projectId, customerId, currentRutaId, currentRutaName }: Props) {
  const router = useRouter()
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [editing, setEditing] = useState(false)
  const [selected, setSelected] = useState(currentRutaId ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/rutas').then(r => r.json()).then(d => setRutas(Array.isArray(d) ? d : []))
    fetch('/api/customers').then(r => r.json()).then((d: Customer[]) => {
      setCustomer(d.find(c => c.id === customerId) ?? null)
    })
  }, [customerId])

  const availableRutas = useMemo(() => {
    if (!customer) return []
    const relatedIds = new Set([customer.id, ...customer.companies.map(co => co.id)])
    return rutas.filter(r => r.cliente_id && relatedIds.has(r.cliente_id))
  }, [rutas, customer])

  async function handleSave() {
    setLoading(true)
    try {
      const r = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruta_id: selected || null }),
      })
      if (!r.ok) throw new Error()
      notifyRefresh()
      toast('Ruta del proyecto actualizada')
      setEditing(false)
      router.refresh()
    } catch {
      toast('Error al actualizar la ruta', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center gap-2 mt-1">
        <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--c-ghost)' }}>Ruta:</span>
        <span className="text-xs font-semibold" style={{ color: currentRutaId ? 'var(--c-navy)' : 'var(--c-ghost)' }}>
          {currentRutaName ?? 'Sin asignar'}
        </span>
        <button
          onClick={() => { setSelected(currentRutaId ?? ''); setEditing(true) }}
          className="text-[10px] font-semibold hover:underline"
          style={{ color: 'var(--c-ghost)' }}
        >
          {currentRutaId ? 'Cambiar' : 'Asignar'}
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-1 flex-wrap">
      <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: 'var(--c-ghost)' }}>Ruta:</span>
      {availableRutas.length === 0 ? (
        <span className="text-xs italic" style={{ color: 'var(--c-ghost)' }}>
          Sin rutas disponibles para este cliente
        </span>
      ) : (
        <select
          value={selected}
          disabled={loading}
          onChange={e => setSelected(e.target.value)}
          className="text-xs rounded-lg px-2 py-1"
          style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
        >
          <option value="">Sin asignar</option>
          {availableRutas.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      )}
      {availableRutas.length > 0 && (
        <button
          onClick={handleSave}
          disabled={loading}
          className="text-xs px-3 py-1 rounded-lg font-semibold disabled:opacity-50"
          style={{ background: 'var(--c-navy)', color: '#fff' }}
        >
          {loading ? '...' : 'Guardar'}
        </button>
      )}
      <button
        onClick={() => setEditing(false)}
        className="text-xs px-2 py-1 rounded-lg"
        style={{ color: 'var(--c-ghost)' }}
      >
        Cancelar
      </button>
    </div>
  )
}
