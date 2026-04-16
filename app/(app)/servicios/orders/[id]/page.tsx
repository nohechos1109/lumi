import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import { canAccessServicios, canCreateServiceManual } from '@/lib/permissions'
import {
  getServiceOrder,
  listServicesByOrder,
} from '@/lib/queries/servicios'
import OrderServicesList from './_components/OrderServicesList'

export default async function ServiceOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) redirect('/login')
  if (!canAccessServicios(session.role)) redirect('/dashboard')

  const order = await getServiceOrder(id)
  if (!order) notFound()

  const services = await listServicesByOrder(id)

  const ESTATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
    pendiente: { label: 'Pendiente', bg: '#F1F5F9', text: '#475569' },
    agendado:  { label: 'Agendado',  bg: '#E0F2FE', text: '#0369A1' },
    en_curso:  { label: 'En curso',  bg: '#FEF3C7', text: '#B45309' },
    atendido:  { label: 'Atendido',  bg: '#DCFCE7', text: '#15803D' },
    cancelado: { label: 'Cancelado', bg: '#FFE4E6', text: '#BE123C' },
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
            style={{ color: '#B45309' }}
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
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: e.bg, color: e.text }}>
              {e.label}
            </span>
          </div>
          {order.motivo_del_servicio && (
            <p className="text-sm" style={{ color: 'var(--c-ink)' }}>{order.motivo_del_servicio}</p>
          )}
          <div className="text-sm mt-2 space-y-1" style={{ color: 'var(--c-dim)' }}>
            {order.customer_name && <div><span style={{ color: 'var(--c-ghost)' }}>Cliente:</span> {order.customer_name}</div>}
            {order.ubicacion && <div><span style={{ color: 'var(--c-ghost)' }}>Ubicación:</span> {order.ubicacion}</div>}
            {order.encargados && <div><span style={{ color: 'var(--c-ghost)' }}>Encargados:</span> {order.encargados}</div>}
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
        services={services}
        canCreate={canCreateServiceManual(session.role)}
      />
    </div>
  )
}
