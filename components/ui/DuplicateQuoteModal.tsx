'use client'

import { useEffect, useState } from 'react'
import { toast } from '@/lib/toast'

interface Project {
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
  const [selection, setSelection] = useState<Selection>(hasProject ? 'same' : 'none')
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Fetch available projects on mount
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((data: Project[]) => {
        setProjects(data)
        // Pre-select first project if none selected yet and 'other' mode
        if (data.length > 0) setSelectedProjectId(data[0].id)
      })
      .catch(() => {/* ignore */})
  }, [])

  // Keyboard handler
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit() {
    setLoading(true)
    try {
      // Build body based on selection
      let body: Record<string, string | null> = {}
      if (hasProject) {
        if (selection === 'same') {
          body = { project_id: currentProjectId }
        } else if (selection === 'other') {
          body = { project_id: selectedProjectId || null }
        } else {
          // 'none'
          body = { project_id: null }
        }
      } else {
        // currentProjectId is null
        if (selection === 'other') {
          body = { project_id: selectedProjectId || null }
        } else {
          // 'none'
          body = { project_id: null }
        }
      }

      const res = await fetch(`/api/quotes/${quoteId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        toast(data.error ?? 'Error al duplicar cotización')
        return
      }

      const newQuote = await res.json()
      onDuplicated(newQuote.id, newQuote.number)
      // Do not setLoading(false) here — navigation will unmount the modal
      return
    } catch {
      toast('Error al duplicar cotización')
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

        {/* Project destination options */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--c-ghost)' }}>
            Proyecto destino
          </p>

          {hasProject ? (
            <>
              {/* Option: same project */}
              <button
                style={optionStyle(selection === 'same')}
                onClick={() => setSelection('same')}
              >
                <span style={radioCircle(selection === 'same')} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>
                  Mismo proyecto
                  {currentProjectName && (
                    <span className="ml-1" style={{ color: 'var(--c-dim)' }}>
                      ({currentProjectName})
                    </span>
                  )}
                </span>
              </button>

              {/* Option: other project */}
              <button
                style={optionStyle(selection === 'other')}
                onClick={() => setSelection('other')}
              >
                <span style={radioCircle(selection === 'other')} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>Otro proyecto</span>
              </button>

              {/* Option: no project */}
              <button
                style={optionStyle(selection === 'none')}
                onClick={() => setSelection('none')}
              >
                <span style={radioCircle(selection === 'none')} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>Sin proyecto</span>
              </button>
            </>
          ) : (
            <>
              {/* Option: select project */}
              <button
                style={optionStyle(selection === 'other')}
                onClick={() => setSelection('other')}
              >
                <span style={radioCircle(selection === 'other')} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>Seleccionar proyecto</span>
              </button>

              {/* Option: no project */}
              <button
                style={optionStyle(selection === 'none')}
                onClick={() => setSelection('none')}
              >
                <span style={radioCircle(selection === 'none')} />
                <span className="text-sm" style={{ color: 'var(--c-ink)' }}>Sin proyecto</span>
              </button>
            </>
          )}

          {/* Project dropdown — visible only when 'other' */}
          {selection === 'other' && (
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="mt-1 text-sm rounded-lg px-3 py-2"
              style={{
                background: 'var(--c-panel)',
                border: '1px solid var(--c-rim)',
                color: 'var(--c-ink)',
                outline: 'none',
              }}
            >
              {projects.length === 0 && (
                <option value="">Sin proyectos disponibles</option>
              )}
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
            style={{
              background: 'transparent',
              color: 'var(--c-dim)',
              border: '1px solid var(--c-rim)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (selection === 'other' && !selectedProjectId)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50 disabled:pointer-events-none"
            style={{
              background: 'var(--c-navy)',
              color: '#FFFFFF',
            }}
          >
            {loading ? 'Duplicando...' : 'Duplicar'}
          </button>
        </div>
      </div>
    </div>
  )
}
