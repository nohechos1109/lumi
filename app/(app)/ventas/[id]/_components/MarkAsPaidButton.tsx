'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  saleId: string
}

export default function MarkAsPaidButton({ saleId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/sales/${saleId}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'finished' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? `Error ${res.status}`)
        return
      }
      setOpen(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
        style={{ background: '#15803D', color: '#fff' }}
      >
        Marcar como terminada
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl"
            style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-bold mb-2" style={{ color: 'var(--c-ink)' }}>
              Marcar como terminada
            </h2>
            <p className="text-sm mb-4" style={{ color: 'var(--c-dim)' }}>
              ¿Confirmas que esta venta ha sido completada? El estado cambiará a <strong>Terminada</strong> y no podrá revertirse.
            </p>
            {error && (
              <p className="text-xs mb-4 px-3 py-2 rounded-lg" style={{ background: '#FFE4E6', color: '#BE123C' }}>
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null) }}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-75 disabled:opacity-40"
                style={{ background: 'var(--c-surface)', color: 'var(--c-ink)', border: '1px solid var(--c-rim)' }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-lg font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ background: '#15803D', color: '#fff' }}
              >
                {loading ? 'Guardando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
