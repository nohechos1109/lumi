import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnProjectsOnly } from '@/lib/permissions'
import { getProject } from '@/lib/queries/projects'
import { listQuotesByProject } from '@/lib/queries/quotes'
import { listSalesByProject } from '@/lib/queries/sales'
import QuotesTable from '@/app/(app)/quotes/_components/QuotesTable'
import ProjectStatusEditor from './_components/ProjectStatusEditor'
import ProjectDescriptionEditor from './_components/ProjectDescriptionEditor'
import ProjectRutaEditor from './_components/ProjectRutaEditor'
import ActivityLog from '@/components/ActivityLog'
import NewQuoteButton from './_components/NewQuoteButton'

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const project = await getProject(id)

  if (!project) notFound()
  if (canViewOwnProjectsOnly(session.role) && project.user_id !== session.userId) notFound()

  const [quotes, sales] = await Promise.all([
    listQuotesByProject(id),
    listSalesByProject(id),
  ])

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
              className="text-2xl font-bold"
              style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}
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
          <ProjectRutaEditor projectId={id} customerId={project.customer_id} currentRutaId={project.ruta_id ?? null} currentRutaName={project.ruta_name ?? null} />
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <ProjectStatusEditor projectId={id} currentStatus={project.status} />
          <NewQuoteButton projectId={id} customerId={project.customer_id} customerName={project.customer_name ?? ''} />
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

      {/* Sales section */}
      {sales.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
              Ventas del Proyecto
            </h2>
            <span className="text-xs font-mono px-2 py-1 rounded bg-white border border-gray-200 text-gray-500">
              {sales.length}
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--c-rim)' }}>
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Número</th>
                  <th className="text-left px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
                  <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Total</th>
                  <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Pagado</th>
                  <th className="text-right px-4 py-2.5 font-semibold" style={{ color: 'var(--c-ghost)' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => {
                  const stateColors: Record<string, { bg: string; text: string }> = {
                    active: { bg: '#E0F2FE', text: '#0369A1' },
                    paid: { bg: '#DCFCE7', text: '#15803D' },
                    cancelled: { bg: '#FFE4E6', text: '#BE123C' },
                  }
                  const c = stateColors[s.state] ?? stateColors.active
                  const labels: Record<string, string> = { active: 'Activa', paid: 'Pagada', cancelled: 'Cancelada' }
                  const fmt = (v: string) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                      <td className="px-4 py-2.5">
                        <Link href={`/ventas/${s.id}`} className="font-mono font-medium hover:underline" style={{ color: 'var(--c-navy)' }}>
                          {s.number}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.text }}>
                          {labels[s.state] ?? s.state}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(s.amount_total)}</td>
                      <td className="px-4 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(s.amount_paid)}</td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold" style={{ color: Number(s.amount_balance) > 0 ? '#B45309' : '#15803D' }}>
                        ${fmt(s.amount_balance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(session.role === 'manager' || session.role === 'admin') && (
        <div className="mt-10">
          <ActivityLog entity="project" entityId={id} />
        </div>
      )}

    </div>
  )
}
