import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import {
  canAccessServicios,
  canCreateServiceOrder,
  canViewOwnServicesOnly,
} from '@/lib/permissions'
import {
  getServiceProject,
  listServiceOrdersByProject,
} from '@/lib/queries/servicios'
import ProjectOrdersList from './_components/ProjectOrdersList'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { stepsFromProject } from '@/lib/servicios-workflow'

export default async function ServiceProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) redirect('/login')
  if (!canAccessServicios(session.role)) redirect('/dashboard')
  if (canViewOwnServicesOnly(session.role)) redirect('/servicios')

  const project = await getServiceProject(id)
  if (!project) notFound()

  const orders = await listServiceOrdersByProject(id)

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    open:        { label: 'Abierto',    cls: 'badge badge-scheduled' },
    in_progress: { label: 'En Proceso', cls: 'badge badge-in-progress' },
    completed:   { label: 'Completado', cls: 'badge badge-attended' },
    cancelled:   { label: 'Cancelado',  cls: 'badge badge-cancelled' },
  }
  const st = STATUS_MAP[project.status] ?? STATUS_MAP.open

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/servicios"
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
          style={{ color: 'var(--c-ghost)' }}
        >
          ← Volver a Servicios
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-3xl font-bold" style={{ color: 'var(--c-ink)', letterSpacing: '0.02em' }}>
              {project.name}
            </h1>
            <span className={st.cls}>{st.label}</span>
          </div>
          <p className="text-sm flex items-center gap-2" style={{ color: 'var(--c-dim)' }}>
            <span className="font-mono">{project.number}</span>
            {project.customer_name && (
              <>
                <span style={{ color: 'var(--c-rim-hi)' }}>•</span>
                <span className="font-semibold" style={{ color: 'var(--c-navy)' }}>{project.customer_name}</span>
              </>
            )}
            <span style={{ color: 'var(--c-rim-hi)' }}>•</span>
            <span suppressHydrationWarning>Creado el {new Date(project.created_at).toLocaleDateString('es-MX')}</span>
          </p>
          {project.observaciones && (
            <p className="text-sm mt-2" style={{ color: 'var(--c-dim)' }}>{project.observaciones}</p>
          )}
        </div>
      </div>

      <WorkflowStepper steps={stepsFromProject(project, orders.length > 0)} />

      <ProjectOrdersList
        projectId={id}
        orders={orders}
        canCreate={canCreateServiceOrder(session.role)}
      />
    </div>
  )
}
