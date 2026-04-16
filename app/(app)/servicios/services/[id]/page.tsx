import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import {
  canAccessServicios,
  canEditService,
  canViewOwnServicesOnly,
} from '@/lib/permissions'
import {
  getService,
  listTechnicianUsers,
} from '@/lib/queries/servicios'
import ServiceEditor from './_components/ServiceEditor'

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) redirect('/login')
  if (!canAccessServicios(session.role)) redirect('/dashboard')

  const service = await getService(id)
  if (!service) notFound()

  if (canViewOwnServicesOnly(session.role)) {
    const assigned = service.technicians?.some(t => t.user_id === session.userId)
    if (!assigned) notFound()
  }

  const canEdit = canEditService(session.role)
  const canManageTech = canEdit && session.role !== 'tecnico'
  const tecnicos = canManageTech ? await listTechnicianUsers() : []

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
        {service.order_number && service.service_order_id && (
          <Link
            href={`/servicios/orders/${service.service_order_id}`}
            className="text-xs font-mono hover:underline"
            style={{ color: '#B45309' }}
          >
            Orden {service.order_number}
          </Link>
        )}
      </div>

      <ServiceEditor
        service={service}
        canEdit={canEdit}
        canManageTech={canManageTech}
        tecnicos={tecnicos}
      />
    </div>
  )
}
