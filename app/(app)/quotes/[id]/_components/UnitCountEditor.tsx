'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast, notifyRefresh } from '@/lib/toast'

interface Props {
  quoteId: string
  unitCount: number
  isLocked?: boolean
}

export default function UnitCountEditor({ quoteId, unitCount, isLocked }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(unitCount))
  const [saving, setSaving] = useState(false)

  async function save(raw: string) {
    const parsed = Math.floor(Number(raw))
    if (!raw || isNaN(parsed) || parsed < 1) {
      setValue(String(unitCount))
      setEditing(false)
      return
    }
    setEditing(false)
    if (parsed === unitCount) return
    setSaving(true)
    try {
      const r = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unit_count: parsed }),
      })
      if (!r.ok) throw new Error()
      notifyRefresh()
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
        onChange={e => setValue(e.target.value)}
        onBlur={() => save(value)}
        onKeyDown={e => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          if (e.key === 'Escape') { setValue(String(unitCount)); setEditing(false) }
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
      onClick={() => { setValue(String(unitCount)); setEditing(true) }}
      className={`group flex items-baseline gap-1.5 ${isLocked ? 'cursor-default' : ''}`}
      style={{ opacity: saving ? 0.5 : 1 }}
    >
      <span
        className="font-heading text-2xl font-bold transition-colors"
        style={{ color: 'var(--c-ink)' }}
      >
        {unitCount}
      </span>
      <span className="text-sm font-sans" style={{ color: 'var(--c-dim)' }}>unidades</span>
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
