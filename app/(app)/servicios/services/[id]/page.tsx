import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import {
  canAccessServicios,
  canEditService,
  canViewOwnServicesOnly,
  canApproveServiceRequest,
  canViewQuoteLink,
} from '@/lib/permissions'
import ActivityLog from '@/components/ActivityLog'
import QuoteLinks from '../../projects/[id]/_components/QuoteLinks'
import pool from '@/lib/db'
import {
  getService,
  listTechnicianUsers,
  listServiceMaterials,
  getServiceOrder,
} from '@/lib/queries/servicios'
import { getUnidad } from '@/lib/queries/unidades'
import { listFilesByEntity } from '@/lib/queries/files'
import { getSale } from '@/lib/queries/sales'
import { listLines } from '@/lib/queries/quote_lines'
import { getSettings } from '@/lib/queries/settings'
import ServiceEditor from './_components/ServiceEditor'
import FileUploader from './_components/FileUploader'
import MaterialsEditor from './_components/MaterialsEditor'
import StepperSidebar from '@/components/ui/StepperSidebar'
import { stepsFromService } from '@/lib/servicios-workflow'
import Breadcrumbs from '@/components/ui/Breadcrumbs'

export default async function ServiceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ new_unit?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const isNewUnit = sp.new_unit === '1'
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) redirect('/login')
  if (!canAccessServicios(session.role)) redirect('/dashboard')

  const service = await getService(id)
  if (!service) notFound()

  if (canViewOwnServicesOnly(session.role)) {
    const allowed = service.assign_all_technicians || service.technicians?.some(t => t.user_id === session.userId)
    if (!allowed) notFound()
  }

  const isLocked = !!service.approved_at || ['pendiente', 'en_revision', 'terminado', 'cancelado'].includes(service.estatus)
  const canEdit = canEditService(session.role) && !isLocked
  const canChangeStatus = canEditService(session.role) && !service.approved_at && !['terminado', 'cancelado'].includes(service.estatus)
  const isAdminOrSoporte = session.role === 'admin' || session.role === 'soporte'
  const reportLocked = !!service.approved_at || ['terminado', 'cancelado'].includes(service.estatus)
  const canEditReport = isAdminOrSoporte ? !reportLocked : canEdit
  const isOrphan = !service.service_order_id
  const canManageTech = canEdit && session.role !== 'tecnico' && isOrphan

  const [tecnicos, files, materials, settings, parentOrder, unidad] = await Promise.all([
    canManageTech ? listTechnicianUsers() : Promise.resolve([]),
    listFilesByEntity('service', id),
    listServiceMaterials(id),
    getSettings(),
    service.service_order_id ? getServiceOrder(service.service_order_id) : Promise.resolve(null),
    service.unidad_id ? getUnidad(service.unidad_id) : Promise.resolve(null),
  ])

  let saleId: string | null = service.sale_id ?? null
  let saleQuoteLines: import('@/lib/queries/quote_lines').QuoteLine[] = []
  let globalDiscount = 0
  const fxRate = Number(settings?.fx_mxn_per_usd ?? 17.85)
  let quoteId: string | null = null

  if (saleId) {
    const sale = await getSale(saleId)
    if (sale?.quote_id) {
      quoteId = sale.quote_id
      const rawLines = await listLines(sale.quote_id)
      const discountLine = rawLines.find(l => l.display_type === 'discount')
      globalDiscount = discountLine ? parseFloat(discountLine.discount_percent) : 0
      saleQuoteLines = rawLines.filter(l => l.display_type === 'product' && Number(l.qty) > 0)
    }
  }

  // Fallback: derive quoteId through project.sale_id if service has no direct sale link yet
  if (!quoteId && service.project_id) {
    const { rows } = await pool.query(
      `SELECT s.quote_id FROM service_projects sp LEFT JOIN sales s ON s.id = sp.sale_id WHERE sp.id = $1`,
      [service.project_id]
    )
    quoteId = rows[0]?.quote_id ?? null
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3 flex-wrap">
        <Breadcrumbs crumbs={[
          { label: 'Servicios', href: '/servicios' },
          ...(service.order_number && service.service_order_id ? [{ label: `Orden ${service.order_number}`, href: `/servicios/orders/${service.service_order_id}` }] : []),
          { label: service.number },
        ]} />
        <ActivityLog entity="service" entityId={id} />
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_240px]" style={{ alignItems: 'start' }}>
        <div>
          <ServiceEditor
            service={service}
            canEdit={canEdit}
            canEditReport={canEditReport}
            canChangeStatus={canChangeStatus}
            canManageTech={canManageTech}
            canApprove={canApproveServiceRequest(session.role)}
            hasMaterials={materials.length > 0}
            tecnicos={tecnicos}
            isAdmin={session.role === 'admin' || session.role === 'manager'}
            parentOrderEstatus={parentOrder?.estatus ?? null}
            unidad={unidad}
            isNewUnit={isNewUnit}
          />

          {quoteId && (
            <QuoteLinks quoteId={quoteId} showQuoteLink={canViewQuoteLink(session.role)} />
          )}

          <MaterialsEditor
            serviceId={id}
            materials={materials}
            canEdit={canEdit}
            saleId={saleId}
            saleQuoteLines={saleQuoteLines}
            globalDiscount={globalDiscount}
            fxRate={fxRate}
            unidadId={service.unidad_id ?? null}
          />

          <FileUploader
            entityType="service"
            entityId={id}
            files={files}
            canEdit={canEdit}
          />
        </div>

        <div className="order-first lg:order-last lg:sticky" style={{ top: 80 }}>
          <StepperSidebar steps={stepsFromService(service)} />
        </div>
      </div>
    </div>
  )
}
