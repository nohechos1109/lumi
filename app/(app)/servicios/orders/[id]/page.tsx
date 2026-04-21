import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import { canAccessServicios, canCreateServiceManual, canCreateServiceOrder, canApproveServiceRequest, canViewOwnServicesOnly, canViewQuoteLink } from '@/lib/permissions'
import {
  getServiceOrder,
  listServicesByOrder,
  listOrderTechnicians,
  listTechnicianUsers,
  isTechnicianOnOrder,
  getServiceProject,
} from '@/lib/queries/servicios'
import { listFilesByEntity } from '@/lib/queries/files'
import pool from '@/lib/db'
import OrderEditor from './_components/OrderEditor'
import OrderServicesList from './_components/OrderServicesList'
import FileUploader from '../../services/[id]/_components/FileUploader'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { stepsFromOrder } from '@/lib/servicios-workflow'
import ActivityLog from '@/components/ActivityLog'
import QuoteLinks from '../../projects/[id]/_components/QuoteLinks'

export default async function ServiceOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) redirect('/login')
  if (!canAccessServicios(session.role)) redirect('/dashboard')

  const order = await getServiceOrder(id)
  if (!order) notFound()

  if (canViewOwnServicesOnly(session.role)) {
    const allowed = await isTechnicianOnOrder(id, session.userId)
    if (!allowed) redirect('/servicios')
  }

  const [services, files, orderTechs, allTecnicos] = await Promise.all([
    listServicesByOrder(id),
    listFilesByEntity('service_order', id),
    listOrderTechnicians(id),
    listTechnicianUsers(),
  ])

  const canManage = canCreateServiceOrder(session.role)
  const canCancel = canApproveServiceRequest(session.role)
  const isLocked = ['terminado', 'cancelado', 'atendido'].includes(order.estatus)
  const canAddServices = canCreateServiceManual(session.role) && !isLocked

  // Resolve quote_id for levantamiento / cotización links
  let quoteId: string | null = null
  const project = await getServiceProject(order.service_project_id)
  if (project?.sale_id) {
    const { rows } = await pool.query(`SELECT quote_id FROM sales WHERE id = $1`, [project.sale_id])
    quoteId = rows[0]?.quote_id ?? null
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <Link
            href="/servicios"
            className="inline-flex items-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
            style={{ color: 'var(--c-ghost)' }}
          >
            ← Servicios
          </Link>
          {order.project_number && (
            <Link
              href={`/servicios/projects/${order.service_project_id}`}
              className="text-xs font-mono hover:underline"
              style={{ color: 'var(--c-navy)' }}
            >
              {order.project_number} — {order.project_name}
            </Link>
          )}
        </div>
        <ActivityLog entity="service_order" entityId={id} />
      </div>

      <WorkflowStepper steps={stepsFromOrder(order)} />

      <OrderEditor
        order={order}
        services={services}
        canManage={canManage}
        canCancel={canCancel}
        orderTechs={orderTechs}
        allTecnicos={allTecnicos}
      />

      {quoteId && (
        <QuoteLinks quoteId={quoteId} showQuoteLink={canViewQuoteLink(session.role)} />
      )}

      <OrderServicesList
        orderId={id}
        customerId={order.customer_id ?? null}
        tipoLugar={order.tipo_lugar ?? null}
        motivo={order.motivo_del_servicio ?? null}
        services={services}
        canCreate={canAddServices}
        role={session.role}
      />

      <FileUploader
        entityType="service_order"
        entityId={id}
        files={files}
        canEdit={canManage}
        label="Referencias"
      />
    </div>
  )
}
