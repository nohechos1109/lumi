'use client'

import { useEffect, useState } from 'react'

interface Props {
  quoteId: string
  installationNotes?: string | null
  onClose: () => void
}

export default function LevantamientoModal({ quoteId, installationNotes, onClose }: Props) {
  const [detalles, setDetalles] = useState(installationNotes ?? '')

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleGenerate() {
    const base = `/api/pdf/${quoteId}/levantamiento`
    const url = detalles.trim()
      ? `${base}?detalles=${encodeURIComponent(detalles.trim())}`
      : base
    window.open(url, '_blank')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
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
          <label
            htmlFor="lev-detalles"
            className="block text-xs font-semibold mb-1.5 uppercase tracking-wide"
            style={{ color: 'var(--c-dim)' }}
          >
            Detalles para la instalación
          </label>
          <p className="text-xs mb-2" style={{ color: 'var(--c-ghost)' }}>
            Opcional. Aparecerá en el PDF al final del documento.
          </p>
          <textarea
            id="lev-detalles"
            value={detalles}
            onChange={(e) => setDetalles(e.target.value)}
            placeholder="Ej: Instalar en la cabina del conductor. Pasar cable por el lado derecho del tablero. Verificar conexión a tierra..."
            rows={6}
            className="w-full rounded-lg p-3 text-sm resize-y"
            style={{
              background: 'var(--c-panel)',
              border: '1px solid var(--c-rim)',
              color: 'var(--c-ink)',
              outline: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.5',
            }}
          />
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
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ background: 'var(--c-navy)', color: '#FFFFFF' }}
          >
            Generar PDF
          </button>
        </div>
      </div>
    </div>
  )
}
