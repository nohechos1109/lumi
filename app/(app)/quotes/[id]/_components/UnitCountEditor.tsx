'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

interface Props {
  quoteId: string
  unitCount: number
  isLocked?: boolean
}

export default function UnitCountEditor({ quoteId, unitCount, isLocked }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(unitCount)
  const [saving, setSaving] = useState(false)

  async function save(newVal: number) {
    const v = Math.floor(Math.max(1, newVal))
    setEditing(false)
    if (v === unitCount) return
    setSaving(true)
    try {
      const r = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_count: v }),
      })
      if (!r.ok) throw new Error()
      router.refresh()
    } catch {
      toast('Error al guardar el número de vehículos', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <input
        type="number"
        min="1"
        step="1"
        value={value}
        onChange={e => setValue(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        onBlur={() => save(value)}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') { setEditing(false); setValue(unitCount) }
        }}
        autoFocus
        className="font-heading text-2xl font-bold w-20 text-center outline-none rounded-lg"
        style={{
          color: 'var(--c-navy)',
          background: 'var(--c-navy-bg)',
          border: '2px solid var(--c-navy)',
        }}
      />
    )
  }

  return (
    <button
      title={isLocked ? undefined : 'Haz clic para editar'}
      disabled={isLocked || saving}
      onClick={() => { setValue(unitCount); setEditing(true) }}
      className={`group flex items-baseline gap-1.5 ${isLocked ? 'cursor-default' : ''}`}
      style={{ opacity: saving ? 0.5 : 1 }}
    >
      <span
        className="font-heading text-2xl font-bold transition-colors"
        style={{ color: 'var(--c-ink)' }}
      >
        {unitCount}
      </span>
      <span className="text-sm font-sans" style={{ color: 'var(--c-dim)' }}>uds</span>
      {!isLocked && (
        <span
          className="text-xs opacity-0 group-hover:opacity-60 transition-opacity ml-0.5"
          style={{ color: 'var(--c-navy)' }}
        >
          ✎
        </span>
      )}
    </button>
  )
}
