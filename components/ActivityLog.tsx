'use client'

import { useState, useEffect, useCallback } from 'react'

const PROJECT_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  follow_up: 'Seguimiento',
  demo: 'Demo',
  approved: 'Aprobado',
  process: 'En Proceso',
  cancelled: 'Cancelado',
  finished: 'Terminado',
  closed: 'Cerrado',
}

const QUOTE_STATE_LABELS: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  expired: 'Expirada',
}

function getLabel(entity: string, value: string): string {
  const map = entity === 'project' ? PROJECT_STATUS_LABELS : QUOTE_STATE_LABELS
  return map[value] ?? value
}

interface AuditEvent {
  id: string
  entity: string
  entity_id: string
  type: string
  payload: { from?: string; to?: string; username?: string }
  created_at: string
}

interface Props {
  entity: 'project' | 'quote'
  entityId: string
}

export default function ActivityLog({ entity, entityId }: Props) {
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(false)

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/audit?entity=${entity}&entity_id=${entityId}`)
      if (res.ok) setEvents(await res.json())
    } finally {
      setLoading(false)
    }
  }, [entity, entityId])

  useEffect(() => {
    if (open) fetchEvents()
  }, [open, fetchEvents])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm font-semibold cursor-pointer hover:underline transition-colors"
        style={{ color: 'var(--c-navy)' }}
      >
        Ver actividad
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
            style={{
              background: 'var(--c-card)',
              border: '1px solid var(--c-rim)',
              boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
              maxHeight: '80vh',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold" style={{ color: 'var(--c-ink)' }}>
                Actividad
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-base font-medium transition-colors hover:opacity-70 cursor-pointer"
                style={{ color: 'var(--c-ghost)', background: 'var(--c-rim)' }}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto" style={{ minHeight: '4rem' }}>
              {loading ? (
                <p className="text-sm" style={{ color: 'var(--c-ghost)' }}>Cargando…</p>
              ) : events.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--c-ghost)' }}>Sin actividad registrada.</p>
              ) : (
                <ol className="relative border-l ml-1" style={{ borderColor: 'var(--c-rim)' }}>
                  {events.map((event) => {
                    const { from, to, username } = event.payload
                    const fromLabel = from ? getLabel(entity, from) : null
                    const toLabel = to ? getLabel(entity, to) : null
                    const date = new Date(event.created_at).toLocaleString('es-MX', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <li key={event.id} className="mb-5 ml-5">
                        <div
                          className="absolute w-3 h-3 rounded-full -left-1.5 mt-1"
                          style={{ background: 'var(--c-navy)', border: '2px solid var(--c-card)', boxSizing: 'border-box' }}
                        />
                        <p className="text-sm font-medium" style={{ color: 'var(--c-ink)' }}>
                          {event.type === 'status_change' && fromLabel && toLabel ? (
                            <>
                              Cambio de estado:{' '}
                              <span style={{ color: 'var(--c-ghost)' }}>{fromLabel}</span>
                              {' → '}
                              <span style={{ color: 'var(--c-navy)', fontWeight: 600 }}>{toLabel}</span>
                            </>
                          ) : (
                            event.type
                          )}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
                          {username && <span>por <strong>{username}</strong> · </span>}
                          {date}
                        </p>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
