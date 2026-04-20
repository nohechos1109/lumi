import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import { canAccessServicios, canApproveServiceRequest, canViewOwnServicesOnly } from '@/lib/permissions'
import { getServiceRequest } from '@/lib/queries/servicios'
import RequestActions from './_components/RequestActions'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pendiente', cls: 'badge badge-in-progress' },
  approved:  { label: 'Aprobada',  cls: 'badge badge-approved' },
  rejected:  { label: 'Rechazada', cls: 'badge badge-rejected' },
  cancelled: { label: 'Cancelada', cls: 'badge badge-cancelled' },
}

export default async function ServiceRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) redirect('/login')
  if (!canAccessServicios(session.role)) redirect('/dashboard')
  if (canViewOwnServicesOnly(session.role)) redirect('/servicios')

  const req = await getServiceRequest(id)
  if (!req) notFound()

  const st = STATUS_MAP[req.status] ?? STATUS_MAP.pending
  const canApprove = canApproveServiceRequest(session.role) &&
    req.status === 'pending' &&
    (session.role !== 'soporte' || !req.assigned_to || req.assigned_to === session.userId)

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/servicios"
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
          style={{ color: 'var(--c-ghost)' }}
        >
          ← Servicios
        </Link>
      </div>

      <div className="flex flex-col gap-3 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--c-ink)' }}>
            Solicitud de Servicio
          </h1>
          <span className={st.cls}>{st.label}</span>
        </div>
        <p className="text-sm" suppressHydrationWarning style={{ color: 'var(--c-ghost)' }}>
          Creada el {new Date(req.created_at).toLocaleDateString('es-MX')}
        </p>
      </div>

      <div className="rounded-xl p-6" style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>
        <div className="space-y-4 text-sm" style={{ color: 'var(--c-ink)' }}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)' }}>Motivo</div>
            <p>{req.motivo}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)' }}>Cliente</div>
              <p>{req.customer_name ?? '—'}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)' }}>Solicitante</div>
              <p>{req.requested_by_username ?? '—'}</p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)' }}>Asignado a</div>
              <p>{req.assigned_to_username ?? 'Sin asignar'}</p>
            </div>
            {req.resolved_service_project_id && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)' }}>Planeación resultante</div>
                <Link
                  href={`/servicios/projects/${req.resolved_service_project_id}`}
                  className="font-mono hover:underline"
                  style={{ color: 'var(--c-navy)' }}
                >
                  {req.resolved_project_number}
                </Link>
              </div>
            )}
          </div>
        </div>

        {canApprove && (
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--c-rim)' }}>
            <RequestActions requestId={id} />
          </div>
        )}
      </div>
    </div>
  )
}
