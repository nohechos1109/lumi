'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ServiceProject } from '@/lib/queries/servicios'
import { toast } from '@/lib/toast'

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  abierto: { label: 'Abierto', cls: 'badge badge-scheduled' },
  cerrado: { label: 'Cerrado', cls: 'badge badge-done' },
}

interface Props {
  project: ServiceProject
  canClose: boolean
  canCloseAction: boolean
  canReopen: boolean
}

export default function ProjectHeader({ project, canClose, canCloseAction, canReopen }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(project.name)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState(false)

  const isClosed = project.status === 'cerrado'
  const st = STATUS_MAP[project.status] ?? STATUS_MAP.abierto

  async function saveName() {
    if (!name.trim() || name === project.name) { setEditingName(false); setName(project.name); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/servicios/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      })
      if (!res.ok) {
        toast('No se pudo actualizar el nombre', 'error')
        setName(project.name)
      } else {
        toast('Nombre actualizado', 'success')
        startTransition(() => router.refresh())
      }
      setEditingName(false)
    } finally {
      setSaving(false)
    }
  }

  async function doClose() {
    setBusy(true)
    try {
      const res = await fetch(`/api/servicios/projects/${project.id}/close`, { method: 'POST' })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(result.error || 'No se pudo cerrar', 'error')
        return
      }
      toast('Planeación cerrada', 'success')
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  async function doReopen() {
    setBusy(true)
    try {
      const res = await fetch(`/api/servicios/projects/${project.id}/reopen`, { method: 'POST' })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast(result.error || 'No se pudo reabrir', 'error')
        return
      }
      toast('Planeación reabierta', 'success')
      startTransition(() => router.refresh())
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          {editingName ? (
            <input
              autoFocus
              value={name}
              disabled={saving}
              onChange={e => setName(e.target.value)}
              onBlur={saveName}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); (e.target as HTMLInputElement).blur() }
                if (e.key === 'Escape') { setName(project.name); setEditingName(false) }
              }}
              className="font-heading text-3xl font-bold w-full"
              style={{ color: 'var(--c-ink)', letterSpacing: '0.02em' }}
            />
          ) : (
            <>
              <h1
                className="font-heading text-3xl font-bold cursor-text"
                style={{ color: 'var(--c-ink)', letterSpacing: '0.02em' }}
                onClick={() => setEditingName(true)}
                title="Clic para editar"
              >
                {project.name}
              </h1>
              <span className={st.cls}>{st.label}</span>
            </>
          )}
        </div>
        <p className="text-sm flex items-center gap-2 flex-wrap" style={{ color: 'var(--c-dim)' }}>
          <span className="font-mono">{project.number}</span>
          {project.customer_name && (
            <>
              <span style={{ color: 'var(--c-rim-hi)' }}>•</span>
              <span className="font-semibold" style={{ color: 'var(--c-navy)' }}>{project.customer_name}</span>
            </>
          )}
          <span style={{ color: 'var(--c-rim-hi)' }}>•</span>
          <span suppressHydrationWarning>Creado el {new Date(project.created_at).toLocaleDateString('es-MX')}</span>
        </p>
        {project.observaciones && (
          <p className="text-sm mt-2" style={{ color: 'var(--c-dim)' }}>{project.observaciones}</p>
        )}
      </div>

      <div className="flex gap-2 items-start">
        {!isClosed && canCloseAction && (
          <button
            type="button"
            disabled={!canClose || busy}
            title={canClose ? undefined : 'Hay órdenes pendientes sin concluir'}
            onClick={doClose}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{
              background: canClose ? 'var(--c-mint)' : 'var(--c-rim-hi)',
              border: 'none',
              cursor: canClose && !busy ? 'pointer' : 'not-allowed',
              opacity: canClose && !busy ? 1 : 0.6,
            }}
          >
            {busy ? '…' : 'Cerrar planeación'}
          </button>
        )}
        {isClosed && canReopen && (
          <button
            type="button"
            disabled={busy}
            onClick={doReopen}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{
              background: 'var(--c-panel)',
              color: 'var(--c-ink)',
              border: '1px solid var(--c-rim)',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? '…' : 'Reabrir'}
          </button>
        )}
      </div>
    </div>
  )
}
