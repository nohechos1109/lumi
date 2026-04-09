import Link from 'next/link'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnProjectsOnly } from '@/lib/permissions'
import { listProjectsByUser, listAllProjects } from '@/lib/queries/projects'
import ProjectsTable from './_components/ProjectsTable'

export default async function ProjectsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const projects = canViewOwnProjectsOnly(session.role)
    ? await listProjectsByUser(session.userId)
    : await listAllProjects()

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1
            className="font-heading text-3xl font-bold"
            style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
          >
            Gestión de Proyectos
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
            {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'} activos
          </p>
        </div>
        <Link
          href="/projects/new"
          className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-85"
          style={{
            background: 'var(--c-navy)',
            color: '#FFFFFF',
          }}
        >
          + Nuevo Proyecto
        </Link>
      </div>

      <ProjectsTable projects={projects} role={session.role} />
    </div>
  )
}
