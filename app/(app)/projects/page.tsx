import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnProjectsOnly } from '@/lib/permissions'
import { listProjectsByUser, listAllProjects } from '@/lib/queries/projects'
import ProjectsTable from './_components/ProjectsTable'
import NewProjectButton from './_components/NewProjectButton'

export default async function ProjectsPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const projects = canViewOwnProjectsOnly(session.role)
    ? await listProjectsByUser(session.userId)
    : await listAllProjects()

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Proyectos</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
            Gestión de Proyectos
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
            {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'} activos
          </p>
        </div>
        <NewProjectButton />
      </div>

      <ProjectsTable projects={projects} role={session.role} />
    </div>
  )
}
