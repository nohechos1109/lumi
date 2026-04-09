'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast, notifyRefresh } from '@/lib/toast'

interface Props {
  projectId: string
  description: string | null
}

export default function ProjectDescriptionEditor({ projectId, description }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(description ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function save() {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed === (description ?? '')) return
    try {
      const r = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed || null }),
      })
      if (!r.ok) throw new Error()
      notifyRefresh()
      router.refresh()
    } catch {
      toast('Error al guardar la descripción', 'error')
      setValue(description ?? '')
    }
  }

  useEffect(() => {
    if (editing && textareaRef.current) {
      const el = textareaRef.current
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
      el.focus()
      // Cursor al final
      el.selectionStart = el.selectionEnd = el.value.length
    }
  }, [editing])

  function startEditing() {
    setValue(description ?? '')
    setEditing(true)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1 mt-3">
        <textarea
          ref={textareaRef}
          value={value}
          rows={2}
          onChange={e => {
            setValue(e.target.value)
            const el = e.target
            el.style.height = 'auto'
            el.style.height = `${Math.min(el.scrollHeight, 200)}px`
          }}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === 'Escape') { setValue(description ?? ''); setEditing(false) }
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) (e.target as HTMLTextAreaElement).blur()
          }}
          placeholder="Agregar descripción del proyecto..."
          className="rounded-lg px-3 py-1.5 text-sm italic outline-none resize-none"
          style={{
            background: 'var(--c-panel)',
            border: '2px solid var(--c-navy)',
            color: 'var(--c-ghost)',
            boxShadow: '0 0 0 3px rgba(27,52,97,0.10)',
            fontFamily: 'inherit',
            lineHeight: '1.5',
            maxHeight: '200px',
            overflowY: 'auto',
            minWidth: '280px',
          }}
        />
        <span className="text-xs" style={{ color: 'var(--c-ghost)' }}>
          Ctrl+Enter para guardar · Esc para cancelar
        </span>
      </div>
    )
  }

  return (
    <button
      onClick={startEditing}
      className="group flex items-center gap-1.5 mt-3 text-left"
    >
      {description ? (
        <p className="text-sm italic" style={{ color: 'var(--c-ghost)' }}>
          "{description}"
          <span
            className="ml-2 opacity-0 group-hover:opacity-60 transition-opacity not-italic"
            style={{ color: 'var(--c-navy)' }}
          >
            ✎
          </span>
        </p>
      ) : (
        <span
          className="text-sm px-3 py-1 rounded-lg border border-dashed transition-colors"
          style={{
            borderColor: 'var(--c-rim-hi)',
            color: 'var(--c-ghost)',
          }}
        >
          + Agregar descripción
        </span>
      )}
    </button>
  )
}
