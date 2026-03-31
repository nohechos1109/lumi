'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

interface Props {
  quoteId: string
  description: string | null
}

export default function DescriptionEditor({ quoteId, description }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(description ?? '')

  async function save() {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed === (description ?? '')) return
    try {
      const r = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed || null }),
      })
      if (!r.ok) throw new Error()
      router.refresh()
    } catch {
      toast('Error al guardar la descripción', 'error')
      setValue(description ?? '')
    }
  }

  if (editing) {
    return (
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') { setValue(description ?? ''); setEditing(false) }
        }}
        autoFocus
        placeholder="Descripción de la cotización..."
        className="text-sm mt-3 max-w-xl w-full rounded-lg px-4 py-2 outline-none"
        style={{
          background: 'var(--c-panel)',
          border: '2px solid var(--c-navy)',
          color: 'var(--c-ink)',
          boxShadow: '0 0 0 3px rgba(27,52,97,0.10)',
        }}
      />
    )
  }

  return (
    <button
      onClick={() => { setValue(description ?? ''); setEditing(true) }}
      className="group flex items-center gap-2 mt-3 text-left max-w-xl"
    >
      {description ? (
        <span
          className="text-sm px-4 py-2 rounded-lg transition-colors"
          style={{
            background: 'var(--c-hover)',
            border: '1px solid var(--c-rim)',
            color: 'var(--c-dim)',
          }}
        >
          {description}
          <span
            className="ml-2 opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ color: 'var(--c-navy)' }}
          >
            ✎
          </span>
        </span>
      ) : (
        <span
          className="text-sm px-4 py-2 rounded-lg border border-dashed transition-colors"
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
