import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import { canAccessServicios, canCreateServiceManual, canEditService, canViewOwnServicesOnly } from '@/lib/permissions'
import {
  getServiceOrder,
  listServicesByOrder,
  listOrderTechnicians,
  isTechnicianOnOrder,
} from '@/lib/queries/servicios'
import { listFilesByEntity } from '@/lib/queries/files'
import OrderServicesList from './_components/OrderServicesList'
import FileUploader from '../../services/[id]/_components/FileUploader'

export default async function ServiceOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) redirect('/login')
  if (!canAccessServicios(session.role)) redirect('/dashboard')

  const order = await getServiceOrder(id)
  if (!order) notFound()

  // Tecnico sólo accede a órdenes donde está asignado (directo o vía servicio).
  if (canViewOwnServicesOnly(session.role)) {
    const allowed = await isTechnicianOnOrder(id, session.userId)
    if (!allowed) redirect('/servicios')
  }

  const [services, files, orderTechs] = await Promise.all([
    listServicesByOrder(id),
    listFilesByEntity('service_order', id),
    listOrderTechnicians(id),
  ])

  const ESTATUS_MAP: Record<string, { label: string; cls: string }> = {
    pendiente: { label: 'Pendiente', cls: 'badge badge-pending' },
    agendado:  { label: 'Agendado',  cls: 'badge badge-scheduled' },
    en_curso:  { label: 'En curso',  cls: 'badge badge-in-progress' },
    atendido:  { label: 'Atendido',  cls: 'badge badge-attended' },
    cancelado: { label: 'Cancelado', cls: 'badge badge-cancelled' },
  }
  const e = ESTATUS_MAP[order.estatus] ?? ESTATUS_MAP.pendiente

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-3xl font-bold font-mono" style={{ color: 'var(--c-ink)' }}>
              {order.number}
            </h1>
            <span className={e.cls}>{e.label}</span>
          </div>
          {order.motivo_del_servicio && (
            <p className="text-sm" style={{ color: 'var(--c-ink)' }}>{order.motivo_del_servicio}</p>
          )}
          <div className="text-sm mt-2 space-y-1" style={{ color: 'var(--c-dim)' }}>
            {order.customer_name && <div><span style={{ color: 'var(--c-ghost)' }}>Cliente:</span> {order.customer_name}</div>}
            {order.tipo_lugar && (
              <div>
                <span style={{ color: 'var(--c-ghost)' }}>Lugar:</span>{' '}
                <span className={`badge badge-${order.tipo_lugar}`}>{order.tipo_lugar === 'taller' ? 'Taller' : 'Calle'}</span>
              </div>
            )}
            {order.ubicacion && <div><span style={{ color: 'var(--c-ghost)' }}>Ubicación:</span> {order.ubicacion}</div>}
            {(order.assign_all_technicians || orderTechs.length > 0) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span style={{ color: 'var(--c-ghost)' }}>Técnicos:</span>
                {order.assign_all_technicians && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}>
                    Todos
                  </span>
                )}
                {orderTechs.map(t => (
                  <span key={t.user_id} className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}>
                    {t.username}
                  </span>
                ))}
              </div>
            )}
            {order.fecha_hora_agendada && (
              <div suppressHydrationWarning>
                <span style={{ color: 'var(--c-ghost)' }}>Agendada:</span>{' '}
                {new Date(order.fecha_hora_agendada).toLocaleString('es-MX')}
              </div>
            )}
          </div>
        </div>
      </div>

      <OrderServicesList
        orderId={id}
        customerId={order.customer_id ?? null}
        tipoLugar={order.tipo_lugar ?? null}
        motivo={order.motivo_del_servicio ?? null}
        services={services}
        canCreate={canCreateServiceManual(session.role)}
      />

      <FileUploader
        entityType="service_order"
        entityId={id}
        files={files}
        canEdit={canEditService(session.role)}
        label="Referencias"
      />
    </div>
  )
}
