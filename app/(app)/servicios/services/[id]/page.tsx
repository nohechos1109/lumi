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
import { listFilesByEntity } from '@/lib/queries/files'
import { getSale } from '@/lib/queries/sales'
import { listLines } from '@/lib/queries/quote_lines'
import { getSettings } from '@/lib/queries/settings'
import ServiceEditor from './_components/ServiceEditor'
import FileUploader from './_components/FileUploader'
import MaterialsEditor from './_components/MaterialsEditor'
import WorkflowStepper from '@/components/ui/WorkflowStepper'
import { stepsFromService } from '@/lib/servicios-workflow'

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  const [tecnicos, files, materials, settings, parentOrder] = await Promise.all([
    canManageTech ? listTechnicianUsers() : Promise.resolve([]),
    listFilesByEntity('service', id),
    listServiceMaterials(id),
    getSettings(),
    service.service_order_id ? getServiceOrder(service.service_order_id) : Promise.resolve(null),
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
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <Link
            href="/servicios"
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition-opacity hover:opacity-70"
            style={{ color: 'var(--c-ghost)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Servicios
          </Link>
          {service.order_number && service.service_order_id && (
            <Link
              href={`/servicios/orders/${service.service_order_id}`}
              className="text-xs font-mono hover:underline"
              style={{ color: 'var(--c-navy)' }}
            >
              Orden {service.order_number}
            </Link>
          )}
        </div>
        <ActivityLog entity="service" entityId={id} />
      </div>

      <WorkflowStepper steps={stepsFromService(service)} />

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
  )
}
