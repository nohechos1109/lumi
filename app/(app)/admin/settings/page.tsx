'use client'

import { useState, useEffect, FormEvent } from 'react'

export default function AdminSettingsPage() {
  const [fx, setFx] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings').then(r => r.json()).then(s => setFx(s?.fx_mxn_per_usd ?? ''))
  }, [])

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fx_mxn_per_usd: Number(fx) }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-sm">
      <div className="mb-8">
        <h1
          className="font-heading text-3xl font-bold uppercase"
          style={{ color: 'var(--c-ink)', letterSpacing: '0.1em' }}
        >
          Configuración
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          Parámetros globales del sistema
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="rounded-2xl p-6 flex flex-col gap-5"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
      >
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

        <div style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1.25rem' }}>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
            style={{
              background: saved ? 'var(--c-mint-bg)' : 'var(--c-gold)',
              color: saved ? 'var(--c-mint)' : '#090B10',
              border: saved ? '1px solid rgba(30,201,122,0.28)' : 'none',
              letterSpacing: '0.1em',
            }}
          >
            {saved ? '¡ Guardado !' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  )
}
