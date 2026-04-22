import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import {
  canAccessServicios,
  canCreateServiceOrder,
  canViewOwnServicesOnly,
  canCloseServiceProject,
  canReopenServiceProject,
  canViewProgressEntries,
  canAddProgressEntry,
  canViewQuoteLink,
} from '@/lib/permissions'
import {
  getServiceProject,
  listServiceOrdersByProject,
  canCloseServiceProject as computeCanClose,
} from '@/lib/queries/servicios'
import pool from '@/lib/db'
import ProjectHeader from './_components/ProjectHeader'
import ProjectOrdersList from './_components/ProjectOrdersList'
import ProgressPanel from './_components/ProgressPanel'
import QuoteLinks from './_components/QuoteLinks'
import StepperSidebar from '@/components/ui/StepperSidebar'
import { stepsFromProject } from '@/lib/servicios-workflow'
import ActivityLog from '@/components/ActivityLog'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

export default async function ServiceProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) redirect('/login')
  if (!canAccessServicios(session.role)) redirect('/dashboard')
  if (canViewOwnServicesOnly(session.role)) redirect('/servicios')

  const project = await getServiceProject(id)
  if (!project) notFound()

  const orders = await listServiceOrdersByProject(id)
  const canClose = await computeCanClose(id)

  // Resolve quote_id through sale_id (if present)
  let quoteId: string | null = null
  if (project.sale_id) {
    const { rows } = await pool.query(`SELECT quote_id FROM sales WHERE id = $1`, [project.sale_id])
    quoteId = rows[0]?.quote_id ?? null
  }

  const isClosed = project.status === 'cerrado'
  const allowNewOrder = !isClosed && canCreateServiceOrder(session.role)
  const role = session.role

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <Breadcrumbs crumbs={[
          { label: 'Servicios', href: '/servicios' },
          { label: `${project.number} — ${project.name}` },
        ]} />
        <ActivityLog entity="service_project" entityId={id} />
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px] items-start">
        <div>
          <ProjectHeader
            project={project}
            canClose={canClose}
            canCloseAction={canCloseServiceProject(role)}
            canReopen={canReopenServiceProject(role)}
          />

          {quoteId && (
            <QuoteLinks quoteId={quoteId} showQuoteLink={canViewQuoteLink(role)} />
          )}

          <ProjectOrdersList
            projectId={id}
            orders={orders}
            canCreate={allowNewOrder}
          />

          {canViewProgressEntries(role) && (
            <ProgressPanel
              projectId={id}
              canAdd={canAddProgressEntry(role)}
            />
          )}
        </div>

        <div className="order-first lg:order-last lg:sticky" style={{ top: 80 }}>
          <StepperSidebar steps={stepsFromProject(project)} />
        </div>
      </div>
    </div>
  )
}
