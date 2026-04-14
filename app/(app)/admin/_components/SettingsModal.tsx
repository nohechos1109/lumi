'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const [fx, setFx] = useState('')
  const [showMargin, setShowMargin] = useState(true)
  const [saved, setSaved] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(s => {
      setFx(s?.fx_mxn_per_usd ?? '')
      setShowMargin(s?.show_margin ?? true)
    })
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fx_mxn_per_usd: Number(fx), show_margin: showMargin }),
    })
    if (!res.ok) {
      const result = await res.json().catch(() => ({}))
      alert(result.error || 'Error al guardar la configuración')
      return
    }
    setSaved(true)
    timerRef.current = setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1200)
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
        aria-labelledby="settings-title"
        className="w-full max-w-sm rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: '1px solid var(--c-rim)' }}
        >
          <div>
            <h2
              id="settings-title"
              className="font-heading text-xl font-bold uppercase"
              style={{ color: 'var(--c-ink)', letterSpacing: '0.08em' }}
            >
              Configuración
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
              Parámetros globales del sistema
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:opacity-70"
            style={{ color: 'var(--c-dim)', cursor: 'pointer', background: 'transparent', border: 'none' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="flex flex-col gap-5 px-6 py-5">
          {/* FX Rate */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}
            >
              Tipo de cambio (MXN / USD)
            </label>
            <input
              type="number"
              step="0.0001"
              value={fx}
              onChange={e => setFx(e.target.value)}
              required
              className="w-full font-mono"
              style={{ background: 'var(--c-panel)' }}
              placeholder="20.0000"
            />
            <p className="text-xs mt-2" style={{ color: 'var(--c-ghost)' }}>
              Valor utilizado en cotizaciones nuevas para convertir USD → MXN.
            </p>
          </div>

          {/* Show Margin Toggle */}
          <div style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1.25rem' }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-dim)', letterSpacing: '0.1em' }}>
                  Mostrar margen de ganancia
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--c-ghost)' }}>
                  Visible en cotizaciones y vistas de manager.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showMargin}
                onClick={() => setShowMargin(v => !v)}
                className="relative flex-shrink-0 rounded-full transition-colors"
                style={{
                  width: '44px',
                  height: '24px',
                  background: showMargin ? 'var(--c-navy)' : 'var(--c-rim)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <span
                  className="absolute rounded-full transition-transform"
                  style={{
                    width: '18px',
                    height: '18px',
                    background: '#fff',
                    top: '3px',
                    left: '3px',
                    transform: showMargin ? 'translateX(20px)' : 'translateX(0)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>
          </div>

          {/* Save */}
          <div style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1.25rem' }}>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
              style={{
                background: saved ? 'var(--c-mint-bg)' : 'var(--c-navy)',
                color: saved ? 'var(--c-mint)' : '#fff',
                border: saved ? '1px solid rgba(30,201,122,0.28)' : 'none',
                letterSpacing: '0.1em',
                cursor: 'pointer',
              }}
            >
              {saved ? '¡ Guardado !' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
