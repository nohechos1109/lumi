'use client'

import { useState, useEffect, useCallback, FormEvent } from 'react'
import { toast } from '@/lib/toast'

interface ProgressEntry {
  id: string
  texto: string
  created_at: string
  author_username?: string
}

interface FileRecord {
  id: string
  entity_id: string
  original_name: string
  mime_type: string
}

interface Props {
  projectId: string
  canAdd: boolean
}

export default function ProgressPanel({ projectId, canAdd }: Props) {
  const [entries, setEntries] = useState<ProgressEntry[]>([])
  const [filesByEntry, setFilesByEntry] = useState<Record<string, FileRecord[]>>({})
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [pickedFiles, setPickedFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/servicios/projects/${projectId}/progress`)
      if (!res.ok) { setEntries([]); return }
      const list: ProgressEntry[] = await res.json()
      setEntries(list)
      // Fetch files per entry in parallel
      const allFiles = await Promise.all(
        list.map(e =>
          fetch(`/api/files?entity_type=service_project_progress&entity_id=${e.id}`)
            .then(r => r.ok ? r.json() as Promise<FileRecord[]> : [])
            .catch(() => [] as FileRecord[])
        )
      )
      const map: Record<string, FileRecord[]> = {}
      list.forEach((e, i) => { map[e.id] = allFiles[i] ?? [] })
      setFilesByEntry(map)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { refresh() }, [refresh])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!texto.trim()) { toast('Texto requerido', 'error'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/servicios/projects/${projectId}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: texto.trim() }),
      })
      const entry = await res.json()
      if (!res.ok) { toast(entry.error || 'Error al guardar avance', 'error'); return }

      // Upload each file
      const failures: string[] = []
      for (const f of pickedFiles) {
        const fd = new FormData()
        fd.append('file', f)
        fd.append('entity_type', 'service_project_progress')
        fd.append('entity_id', entry.id)
        const up = await fetch('/api/files', { method: 'POST', body: fd })
        if (!up.ok) failures.push(f.name)
      }

      if (failures.length) {
        toast(`Avance guardado; fallaron archivos: ${failures.join(', ')}`, 'error')
      } else {
        toast('Avance agregado', 'success')
      }

      setTexto('')
      setPickedFiles([])
      await refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--c-ink)' }}>Avances</h2>

      {canAdd && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl p-4 mb-5 flex flex-col gap-3"
          style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
        >
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={3}
            required
            placeholder="Describe el avance..."
            className="w-full text-sm rounded-xl px-4 py-2.5 resize-none"
            style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
          />
          <div className="flex items-center gap-3 flex-wrap">
            <input
              type="file"
              multiple
              onChange={e => setPickedFiles(Array.from(e.target.files ?? []))}
              className="text-xs"
            />
            {pickedFiles.length > 0 && (
              <span className="text-xs" style={{ color: 'var(--c-ghost)' }}>
                {pickedFiles.length} archivo{pickedFiles.length > 1 ? 's' : ''} seleccionado{pickedFiles.length > 1 ? 's' : ''}
              </span>
            )}
            <button
              type="submit"
              disabled={submitting || !texto.trim()}
              className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{
                background: submitting ? 'var(--c-rim-hi)' : 'var(--c-navy)',
                cursor: submitting ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
            >
              {submitting ? '…' : 'Agregar avance'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm" style={{ color: 'var(--c-ghost)' }}>Cargando…</p>
      ) : entries.length === 0 ? (
        <div className="rounded-xl p-6 text-center" style={{ border: '1px dashed var(--c-rim)', color: 'var(--c-dim)' }}>
          Sin avances registrados.
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {entries.map(e => {
            const files = filesByEntry[e.id] ?? []
            return (
              <li
                key={e.id}
                className="rounded-xl p-4"
                style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
              >
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--c-ink)' }}>{e.texto}</p>
                {files.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {files.map(f => {
                      const isImg = f.mime_type.startsWith('image/')
                      return (
                        <a
                          key={f.id}
                          href={`/api/files/${f.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg"
                          style={{
                            background: 'var(--c-panel)',
                            color: 'var(--c-navy)',
                            border: '1px solid var(--c-rim)',
                          }}
                        >
                          {isImg ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
                          ) : (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                          )}
                          {f.original_name}
                        </a>
                      )
                    })}
                  </div>
                )}
                <p className="text-xs mt-2" style={{ color: 'var(--c-ghost)' }} suppressHydrationWarning>
                  {e.author_username && <>por <strong>{e.author_username}</strong> · </>}
                  {new Date(e.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
