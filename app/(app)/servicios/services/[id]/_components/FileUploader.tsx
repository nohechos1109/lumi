'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

interface FileRecord {
  id: string
  original_name: string
  mime_type: string
  file_size: number
  uploaded_by_username?: string
  created_at: string
}

interface Props {
  entityType: string
  entityId: string
  files: FileRecord[]
  canEdit: boolean
  label?: string
}

export default function FileUploader({ entityType, entityId, files, canEdit, label }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        const form = new FormData()
        form.append('file', file)
        form.append('entity_type', entityType)
        form.append('entity_id', entityId)
        const res = await fetch('/api/files', { method: 'POST', body: form })
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          toast(err.error || `Error subiendo ${file.name}`, 'error')
        }
      }
      toast('Archivos subidos', 'success')
      router.refresh()
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleDelete(fileId: string) {
    const res = await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
    if (!res.ok) {
      toast('Error al eliminar archivo', 'error')
      return
    }
    toast('Archivo eliminado', 'success')
    router.refresh()
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="mt-8">
      <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--c-ghost)' }}>
        {label || 'Evidencia / Archivos'}
      </h2>

      {canEdit && (
        <div
          className="rounded-xl p-6 mb-4 text-center cursor-pointer transition-colors"
          style={{
            border: '2px dashed var(--c-rim)',
            color: 'var(--c-dim)',
            background: uploading ? 'var(--c-panel)' : 'transparent',
          }}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.stopPropagation() }}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); handleUpload(e.dataTransfer.files) }}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,application/pdf,video/mp4,video/quicktime"
            className="hidden"
            onChange={e => handleUpload(e.target.files)}
          />
          {uploading ? (
            <span className="text-sm font-semibold">Subiendo...</span>
          ) : (
            <span className="text-sm">Arrastra archivos aquí o haz clic para seleccionar</span>
          )}
        </div>
      )}

      {files.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--c-dim)' }}>Sin archivos.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {files.map(f => {
            const isImage = f.mime_type.startsWith('image/')
            return (
              <div
                key={f.id}
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
              >
                {isImage ? (
                  <a href={`/api/files/${f.id}`} target="_blank" rel="noopener noreferrer">
                    <img
                      src={`/api/files/${f.id}`}
                      alt={f.original_name}
                      className="w-full h-40 object-cover"
                    />
                  </a>
                ) : (
                  <a
                    href={`/api/files/${f.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center h-40"
                    style={{ background: 'var(--c-panel)' }}
                  >
                    <span className="text-2xl font-bold" style={{ color: 'var(--c-ghost)' }}>
                      {f.mime_type.includes('pdf') ? 'PDF' : 'VID'}
                    </span>
                  </a>
                )}
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--c-ink)' }}>{f.original_name}</p>
                  <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>
                    {formatSize(f.file_size)} — {f.uploaded_by_username ?? ''}
                  </p>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="text-xs mt-1 hover:underline"
                      style={{ color: '#991B1B', background: 'transparent', border: 'none', cursor: 'pointer' }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
