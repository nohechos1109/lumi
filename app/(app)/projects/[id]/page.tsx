import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnProjectsOnly } from '@/lib/permissions'
import { getProject } from '@/lib/queries/projects'
import { listQuotesByProject } from '@/lib/queries/quotes'
import QuotesTable from '@/app/(app)/quotes/_components/QuotesTable'
import ProjectStatusEditor from './_components/ProjectStatusEditor'
import ProjectDescriptionEditor from './_components/ProjectDescriptionEditor'
import ActivityLog from '@/components/ActivityLog'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const project = await getProject(id)

  if (!project) notFound()
  if (canViewOwnProjectsOnly(session.role) && project.user_id !== session.userId) notFound()

  const quotes = await listQuotesByProject(id)

  return (
    <div>
      {/* Back link */}
      <div className="mb-6">
        <Link 
          href="/projects"
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
          style={{ color: 'var(--c-ghost)' }}
        >
          ← Volver a Proyectos
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="font-heading text-4xl font-bold"
              style={{ color: 'var(--c-ink)', letterSpacing: '0.02em' }}
            >
              {project.name}
            </h1>
          </div>
          <p className="text-sm flex items-center gap-2" style={{ color: 'var(--c-dim)' }}>
            <span className="font-semibold" style={{ color: 'var(--c-navy)' }}>{project.customer_name}</span>
            <span style={{ color: 'var(--c-rim-hi)' }}>•</span>
            <span suppressHydrationWarning>Creado el {new Date(project.created_at).toLocaleDateString('es-MX')}</span>
          </p>
          <ProjectDescriptionEditor projectId={id} description={project.description ?? null} />
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <ProjectStatusEditor projectId={id} currentStatus={project.status} />
          <Link
            href={`/quotes/new?project_id=${id}&customer_id=${project.customer_id}`}
            className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-85"
            style={{
              background: 'var(--c-navy)',
              color: '#FFFFFF',
            }}
          >
            + Nueva Cotización
          </Link>
        </div>
      </div>

      {/* Quotes List Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--c-ink)' }}>
            Cotizaciones del Proyecto
          </h2>
          <span className="text-xs font-mono px-2 py-1 rounded bg-white border border-gray-200 text-gray-500">
            {quotes.length} {quotes.length === 1 ? 'RECURSO' : 'RECURSOS'}
          </span>
        </div>
        
        <QuotesTable 
          quotes={quotes} 
          role={session.role} 
          hideCustomer={true} 
          hideDate={true} 
          showDescription={true} 
        />
      </div>

      {(session.role === 'manager' || session.role === 'admin') && (
        <div className="mt-10">
          <ActivityLog entity="project" entityId={id} />
        </div>
      )}

    </div>
  )
}
