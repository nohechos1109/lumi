'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'

interface Project {
  id: string
  name: string
  customer_name?: string
  date: string
  status: string
  total_amount?: string
  quote_count?: number
}

const PROJECT_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  draft:       { label: 'Borrador',   cls: 'badge badge-draft' },
  process:     { label: 'Proceso',    cls: 'badge badge-process' },
  approved:    { label: 'Aprobado',   cls: 'badge badge-confirmed' },
  demo:        { label: 'Demo',       cls: 'badge badge-demo' },
  follow_up:   { label: 'Seguimiento', cls: 'badge badge-sent' },
  closed:      { label: 'Cerrado',    cls: 'badge badge-cancelled' },
  deleted:     { label: 'Borrado',    cls: 'badge badge-expired' },
}

export default function ProjectsTable({ projects }: { projects: Project[] }) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setDeleteId(null)
      router.refresh()
    }
  }

  if (projects.length === 0) {
    return (
      <div
        className="text-center py-24 rounded-xl"
        style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}
      >
        <p className="text-base font-semibold" style={{ color: 'var(--c-dim)' }}>
          Sin proyectos
        </p>
        <p className="text-sm mt-1.5" style={{ color: 'var(--c-ghost)' }}>
          Crea tu primer proyecto para organizar tus cotizaciones.
        </p>
      </div>
    )
  }

  const deleteTarget = projects.find(p => p.id === deleteId)

  return (
    <>
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)', boxShadow: '0 1px 4px rgba(27,52,97,0.06)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Proyecto</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Cliente</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Fecha</th>
                <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Estado</th>
                <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Total Acum.</th>
                <th className="px-5 py-4 w-28"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const s = PROJECT_STATUS_LABELS[p.status] ?? { label: p.status, cls: 'badge badge-expired' }
                return (
                  <tr
                    key={p.id}
                    className="tr-hover transition-colors"
                    style={{ borderTop: '1px solid var(--c-rim)' }}
                  >
                    <td className="px-5 py-4 font-semibold" style={{ color: 'var(--c-navy)' }}>
                      <div className="flex flex-col">
                        <span>{p.name}</span>
                        <span className="text-[10px] font-normal opacity-60 uppercase">{p.quote_count} {p.quote_count === 1 ? 'cotización' : 'cotizaciones'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4" style={{ color: 'var(--c-ink)' }}>
                      {p.customer_name}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                      {new Date(p.date).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={s.cls}>{s.label}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-medium" style={{ color: 'var(--c-ink)' }}>
                      ${Number(p.total_amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          aria-label="Eliminar proyecto"
                          onClick={() => setDeleteId(p.id)}
                          className="btn-delete text-xs"
                        >
                          ✕
                        </button>
                        <Link
                          href={`/projects/${p.id}`}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80 whitespace-nowrap"
                          style={{
                            color: 'var(--c-navy)',
                            background: 'var(--c-navy-bg)',
                            border: '1px solid var(--c-navy-bd)',
                          }}
                        >
                          Entrar →
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && deleteTarget && (
        <ConfirmModal
          message={`¿Eliminar el proyecto "${deleteTarget.name}"? Las cotizaciones relacionadas no se borrarán, pero dejarán de estar vinculadas a este proyecto.`}
          confirmLabel="Eliminar"
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </>
  )
}
