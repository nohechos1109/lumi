'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast, notifyRefresh } from '@/lib/toast'

interface Props {
  quoteId: string
  installationNotes?: string | null
  onClose: () => void
}

export default function LevantamientoModal({ quoteId, installationNotes, onClose }: Props) {
  const router = useRouter()
  const [detalles, setDetalles] = useState(installationNotes ?? '')
  const [saving, setSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-expand textarea on open
  useEffect(() => {
    if (textareaRef.current) {
      const el = textareaRef.current
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function saveNotes(value: string) {
    const trimmed = value.trim()
    if (trimmed === (installationNotes ?? '').trim()) return
    setSaving(true)
    try {
      const r = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installation_notes: trimmed || null }),
      })
      if (!r.ok) throw new Error()
      notifyRefresh()
      router.refresh()
    } catch {
      toast('Error al guardar los detalles', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleGenerate() {
    await saveNotes(detalles)
    const trimmed = detalles.trim()
    const base = `/api/pdf/${quoteId}/levantamiento`
    const url = trimmed
      ? `${base}?detalles=${encodeURIComponent(trimmed)}`
      : base
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lev-title"
        className="w-full max-w-md rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl text-white text-base"
            style={{ background: 'var(--c-navy)' }}
          >
            📋
          </div>
          <div>
            <p id="lev-title" className="text-base font-semibold" style={{ color: 'var(--c-ink)' }}>
              Levantamiento PDF
            </p>
            <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>
              Solo muestra descripción y cantidad · Sin precios
            </p>
          </div>
        </div>

        {/* Textarea */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <label
              htmlFor="lev-detalles"
              className="block text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--c-dim)' }}
            >
              Detalles para la instalación
            </label>
            {saving && (
              <span className="text-xs" style={{ color: 'var(--c-ghost)' }}>Guardando...</span>
            )}
          </div>
          <p className="text-xs mb-2" style={{ color: 'var(--c-ghost)' }}>
            Opcional. Aparecerá en el PDF al final del documento.
          </p>
          <textarea
            ref={textareaRef}
            id="lev-detalles"
            value={detalles}
            onChange={(e) => {
              setDetalles(e.target.value)
              const el = e.target
              el.style.height = 'auto'
              el.style.height = `${Math.min(el.scrollHeight, 440)}px`
            }}
            onBlur={(e) => saveNotes(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                saveNotes(detalles)
                textareaRef.current?.blur()
              }
            }}
            placeholder="Ej: Instalar en la cabina del conductor. Pasar cable por el lado derecho del tablero. Verificar conexión a tierra..."
            rows={4}
            className="w-full rounded-lg p-3 text-sm resize-none"
            style={{
              background: 'var(--c-panel)',
              border: '1px solid var(--c-rim)',
              color: 'var(--c-ink)',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.5',
              maxHeight: '440px',
              overflowY: 'auto',
            }}
          />
          <span className="text-xs text-right block" style={{ color: 'var(--c-ghost)' }}>
            {detalles.length} caracteres
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
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
            type="button"
            onClick={handleGenerate}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: 'var(--c-navy)', color: '#FFFFFF' }}
          >
            {saving ? 'Guardando...' : 'Generar PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
