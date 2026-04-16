import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { redirect } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import {
  canAccessServicios,
  canCreateServiceProject,
  canCreateServiceManual,
  canCreateServiceRequest,
  canApproveServiceRequest,
  canViewOwnServicesOnly,
} from '@/lib/permissions'
import {
  listServiceProjects,
  listServices,
  listServicesByTechnician,
  listServiceRequests,
  listServiceRequestsByAssignee,
  listServiceRequestsByRequester,
} from '@/lib/queries/servicios'
import ServiciosLanding from './_components/ServiciosLanding'

export default async function ServiciosPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.userId) redirect('/login')
  if (!canAccessServicios(session.role)) redirect('/dashboard')

  const isTecnico = canViewOwnServicesOnly(session.role)

  const [projects, services, requests] = await Promise.all([
    isTecnico ? Promise.resolve([]) : listServiceProjects(),
    isTecnico ? listServicesByTechnician(session.userId) : listServices(),
    canApproveServiceRequest(session.role)
      ? listServiceRequests()
      : canCreateServiceRequest(session.role)
        ? listServiceRequestsByRequester(session.userId)
        : Promise.resolve([]),
  ])

  return (
    <ServiciosLanding
      role={session.role}
      userId={session.userId}
      projects={projects}
      services={services}
      requests={requests}
      perms={{
        createProject: canCreateServiceProject(session.role),
        createService: canCreateServiceManual(session.role),
        createRequest: canCreateServiceRequest(session.role),
        approveRequest: canApproveServiceRequest(session.role),
        tecnicoOnly: isTecnico,
      }}
    />
  )
}
