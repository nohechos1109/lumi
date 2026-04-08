import { getAuditEvents } from '@/lib/queries/audit'

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

interface Props {
  entity: 'project' | 'quote'
  entityId: string
}

export default async function ActivityLog({ entity, entityId }: Props) {
  const events = await getAuditEvents(entity, entityId)

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--c-ink)' }}>
        Actividad
      </h2>

      {events.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--c-ghost)' }}>
          Sin actividad registrada.
        </p>
      ) : (
        <ol className="relative border-l" style={{ borderColor: 'var(--c-rim)' }}>
          {events.map((event) => {
            const payload = event.payload as { from?: string; to?: string; username?: string }
            const from = payload.from ? getLabel(entity, payload.from) : null
            const to = payload.to ? getLabel(entity, payload.to) : null
            const date = new Date(event.created_at).toLocaleString('es-MX', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <li key={event.id} className="mb-6 ml-4">
                <div
                  className="absolute w-2.5 h-2.5 rounded-full -left-1.5 mt-1"
                  style={{ background: 'var(--c-navy)', border: '2px solid var(--c-card)' }}
                />
                <p className="text-sm font-medium" style={{ color: 'var(--c-ink)' }}>
                  {event.type === 'status_change' && from && to ? (
                    <>
                      Cambio de estado:{' '}
                      <span style={{ color: 'var(--c-ghost)' }}>{from}</span>
                      {' → '}
                      <span style={{ color: 'var(--c-navy)', fontWeight: 600 }}>{to}</span>
                    </>
                  ) : (
                    event.type
                  )}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
                  {payload.username && <span>por <strong>{payload.username}</strong> · </span>}
                  {date}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
