import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import { canAccessServicios, canCreateServiceManual, canCreateServiceOrder, canApproveServiceRequest, canViewOwnServicesOnly } from '@/lib/permissions'
import {
  getServiceOrder,
  listServicesByOrder,
  listOrderTechnicians,
  listTechnicianUsers,
  isTechnicianOnOrder,
} from '@/lib/queries/servicios'
import { listFilesByEntity } from '@/lib/queries/files'
import OrderEditor from './_components/OrderEditor'
import OrderServicesList from './_components/OrderServicesList'
import FileUploader from '../../services/[id]/_components/FileUploader'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { stepsFromOrder } from '@/lib/servicios-workflow'

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

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1">
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

      <WorkflowStepper steps={stepsFromOrder(order)} />

      <OrderEditor
        order={order}
        services={services}
        canManage={canManage}
        canCancel={canCancel}
        orderTechs={orderTechs}
        allTecnicos={allTecnicos}
      />

      <OrderServicesList
        orderId={id}
        customerId={order.customer_id ?? null}
        tipoLugar={order.tipo_lugar ?? null}
        motivo={order.motivo_del_servicio ?? null}
        services={services}
        canCreate={canAddServices}
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
