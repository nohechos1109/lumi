'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

interface Props {
  quoteId: string
  installationNotes: string | null
}

export default function InstallationNotesEditor({ quoteId, installationNotes }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(installationNotes ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function save() {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed === (installationNotes ?? '')) return
    try {
      const r = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installation_notes: trimmed || null }),
      })
      if (!r.ok) throw new Error()
      router.refresh()
    } catch {
      toast('Error al guardar los detalles de instalación', 'error')
      setValue(installationNotes ?? '')
    }
  }

  function startEditing() {
    setValue(installationNotes ?? '')
    setEditing(true)
    // Focus on next tick after render
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-ghost)' }}>
          Detalles para la instalación
        </span>
        <textarea
          ref={textareaRef}
          value={value}
          rows={4}
          onChange={e => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === 'Escape') { setValue(installationNotes ?? ''); setEditing(false) }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) (e.target as HTMLTextAreaElement).blur()
          }}
          placeholder="Ej: Instalar en cabina del conductor. Cable por el lado derecho del tablero..."
          className="w-full rounded-lg px-4 py-2 text-sm outline-none resize-none"
          style={{
            background: 'var(--c-panel)',
            border: '2px solid var(--c-navy)',
            color: 'var(--c-ink)',
            boxShadow: '0 0 0 3px rgba(27,52,97,0.10)',
            fontFamily: 'inherit',
            lineHeight: '1.5',
          }}
        />
        <span className="text-xs" style={{ color: 'var(--c-ghost)' }}>
          Ctrl+Enter para guardar · Esc para cancelar
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--c-ghost)' }}>
        Detalles para la instalación
      </span>
      <button
        onClick={startEditing}
        className="group flex items-start gap-2 text-left w-full"
      >
        {installationNotes ? (
          <span
            className="text-sm px-4 py-2 rounded-lg transition-colors w-full whitespace-pre-wrap"
            style={{
              background: 'var(--c-hover)',
              border: '1px solid var(--c-rim)',
              color: 'var(--c-dim)',
            }}
          >
            {installationNotes}
            <span
              className="ml-2 opacity-0 group-hover:opacity-60 transition-opacity"
              style={{ color: 'var(--c-navy)' }}
            >
              ✎
            </span>
          </span>
        ) : (
          <span
            className="text-sm px-4 py-2 rounded-lg border border-dashed transition-colors w-full"
            style={{
              borderColor: 'var(--c-rim-hi)',
              color: 'var(--c-ghost)',
            }}
          >
            + Agregar detalles de instalación
          </span>
        )}
      </button>
    </div>
  )
}
