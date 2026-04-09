'use client'

import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'

interface Project {
  id: string
  name: string
  customer_id: string | null
}

interface Customer {
  id: string
  name: string
}

interface Props {
  quoteId: string
  currentProjectId: string | null
  currentProjectName: string | null
  onClose: () => void
  onDuplicated: (newQuoteId: string, newQuoteNumber: string) => void
}

type Selection = 'same' | 'other' | 'none'

export default function DuplicateQuoteModal({
  quoteId,
  currentProjectId,
  currentProjectName,
  onClose,
  onDuplicated,
}: Props) {
  const hasProject = currentProjectId !== null

  const [projects, setProjects] = useState<Project[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selection, setSelection] = useState<Selection>(hasProject ? 'same' : 'none')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: Project[]) => {
        setProjects(data)
        if (data.length > 0) setSelectedProjectId(data[0].id)
      })
      .catch(() => {/* ignore */})

    fetch('/api/customers')
      .then(r => r.json())
      .then((data: Customer[]) => setCustomers(data))
      .catch(() => {/* ignore */})
  }, [])

  // Auto-select customer based on selected project
  useEffect(() => {
    if (projects.length === 0) return
    let projectId: string | null = null
    if (selection === 'same' && currentProjectId) {
      projectId = currentProjectId
    } else if (selection === 'other' && selectedProjectId) {
      projectId = selectedProjectId
    } else {
      return
    }
    const project = projects.find(p => p.id === projectId)
    if (project?.customer_id) {
      setSelectedCustomerId(project.customer_id)
    }
  }, [selection, selectedProjectId, projects, currentProjectId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit() {
    if (!selectedCustomerId) {
      toast('Selecciona un cliente para la nueva cotización', 'error')
      return
    }

    setLoading(true)
    try {
      let body: Record<string, string | null> = { customer_id: selectedCustomerId }

      if (hasProject) {
        if (selection === 'same') {
          body.project_id = currentProjectId
        } else if (selection === 'other') {
          body.project_id = selectedProjectId || null
        } else {
          body.project_id = null
        }
      } else {
        if (selection === 'other') {
          body.project_id = selectedProjectId || null
        } else {
          body.project_id = null
        }
      }

      const res = await fetch(`/api/quotes/${quoteId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        toast(data.error ?? 'Error al duplicar cotización', 'error')
        return
      }

      const newQuote = await res.json()
      onDuplicated(newQuote.id, newQuote.number)
      return
    } catch {
      toast('Error al duplicar cotización', 'error')
      setLoading(false)
    }
  }

  const optionStyle = (active: boolean) => ({
    background: active ? 'var(--c-navy-bg)' : 'var(--c-panel)',
    border: active ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    textAlign: 'left' as const,
    transition: 'background 0.1s, border-color 0.1s',
  })

  const radioCircle = (active: boolean) => ({
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    border: active ? '5px solid var(--c-navy)' : '2px solid var(--c-rim)',
    flexShrink: 0,
    transition: 'border 0.1s',
  })

  const selectStyle = {
    background: 'var(--c-panel)',
    border: '1px solid var(--c-rim)',
    color: 'var(--c-ink)',
    outline: 'none',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Duplicar Cotización"
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-base font-semibold" style={{ color: 'var(--c-ink)' }}>
          Duplicar Cotización
        </h2>

        {/* Customer selector */}
        {(() => {
          const locked = selection === 'same' || selection === 'other'
          return (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>
                Cliente de la nueva cotización
                {locked && (
                  <span className="ml-1.5 normal-case font-normal" style={{ color: 'var(--c-ghost)' }}>
                    (definido por el proyecto)
                  </span>
                )}
              </p>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                disabled={locked}
                className="text-sm rounded-lg px-3 py-2"
                style={{
                  ...selectStyle,
                  opacity: locked ? 0.5 : 1,
                  cursor: locked ? 'not-allowed' : 'default',
                }}
              >
                <option value="">— Seleccionar cliente —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )
        })()}

        {/* Project destination options */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--c-ghost)' }}>
            Proyecto destino
          </p>

          {hasProject ? (
            <>
              <button style={optionStyle(selection === 'same')} onClick={() => setSelection('same')}>
                <span style={radioCircle(selection === 'same')} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>
                  Mismo proyecto
                  {currentProjectName && (
                    <span className="ml-1" style={{ color: 'var(--c-dim)' }}>({currentProjectName})</span>
                  )}
                </span>
              </button>

              <button style={optionStyle(selection === 'other')} onClick={() => setSelection('other')}>
                <span style={radioCircle(selection === 'other')} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>Otro proyecto</span>
              </button>

              {selection === 'other' && (
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2"
                  style={selectStyle}
                >
                  {projects.length === 0 && <option value="">Sin proyectos disponibles</option>}
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}

              <button style={optionStyle(selection === 'none')} onClick={() => setSelection('none')}>
                <span style={radioCircle(selection === 'none')} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>Sin proyecto</span>
              </button>
            </>
          ) : (
            <>
              <button style={optionStyle(selection === 'other')} onClick={() => setSelection('other')}>
                <span style={radioCircle(selection === 'other')} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>Seleccionar proyecto</span>
              </button>

              {selection === 'other' && (
                <select
                  value={selectedProjectId}
                  onChange={e => setSelectedProjectId(e.target.value)}
                  className="text-sm rounded-lg px-3 py-2"
                  style={selectStyle}
                >
                  {projects.length === 0 && <option value="">Sin proyectos disponibles</option>}
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}

              <button style={optionStyle(selection === 'none')} onClick={() => setSelection('none')}>
                <span style={radioCircle(selection === 'none')} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>Sin proyecto</span>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
            style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !selectedCustomerId || (selection === 'other' && !selectedProjectId)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50 disabled:pointer-events-none"
            style={{ background: 'var(--c-navy)', color: '#FFFFFF' }}
          >
            {loading ? 'Duplicando...' : 'Duplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
