'use client'

import { useEffect, useState } from 'react'

export interface ContactDeps {
  projects: number
  quotes: number
  sales: number
  customer_payments: number
  service_projects: number
  services: number
  total_hard: number
}

interface Props {
  contactName: string
  deps: ContactDeps | null
  loading: boolean
  onCancel: () => void
  onArchive: () => void
  onDeleteSimple: () => void
  onDeleteCascade: () => void
}

export default function CustomerDeleteModal({
  contactName,
  deps,
  loading,
  onCancel,
  onArchive,
  onDeleteSimple,
  onDeleteCascade,
}: Props) {
  const [confirmText, setConfirmText] = useState('')
  const CONFIRM_WORD = 'ELIMINAR TODO'

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const hasDeps = deps !== null && deps.total_hard > 0
  const cascadeReady = confirmText.trim() === CONFIRM_WORD

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--c-ink)' }}>
            Eliminar contacto
          </h2>
          <p className="text-sm" style={{ color: 'var(--c-dim)' }}>
            <strong style={{ color: 'var(--c-ink)' }}>{contactName}</strong>
          </p>
        </div>

        {loading && (
          <p className="text-sm font-mono uppercase tracking-widest text-center py-4" style={{ color: 'var(--c-ghost)' }}>
            Revisando dependencias...
          </p>
        )}

        {!loading && deps && !hasDeps && (
          <>
            <p className="text-sm" style={{ color: 'var(--c-ink)' }}>
              Este contacto no tiene proyectos, cotizaciones, ventas ni pagos asociados.
            </p>
            <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>
              Se eliminará permanentemente. Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
                style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
              >
                Cancelar
              </button>
              <button
                autoFocus
                onClick={onDeleteSimple}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
                style={{ background: 'var(--c-rose)', color: '#fff' }}
              >
                Eliminar
              </button>
            </div>
          </>
        )}

        {!loading && deps && hasDeps && (
          <>
            <div
              className="rounded-xl p-4 text-sm"
              style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.25)', color: 'var(--c-ink)' }}
            >
              <p className="font-semibold mb-2" style={{ color: '#ea580c' }}>
                Este contacto tiene registros asociados:
              </p>
              <ul className="space-y-1 text-xs font-mono">
                {deps.projects > 0          && <li>• {deps.projects} proyecto{deps.projects === 1 ? '' : 's'}</li>}
                {deps.quotes > 0            && <li>• {deps.quotes} cotización{deps.quotes === 1 ? '' : 'es'}</li>}
                {deps.sales > 0             && <li>• {deps.sales} venta{deps.sales === 1 ? '' : 's'}</li>}
                {deps.customer_payments > 0 && <li>• {deps.customer_payments} pago{deps.customer_payments === 1 ? '' : 's'}</li>}
                {deps.service_projects > 0  && <li>• {deps.service_projects} proyecto{deps.service_projects === 1 ? '' : 's'} de servicio</li>}
                {deps.services > 0          && <li>• {deps.services} servicio{deps.services === 1 ? '' : 's'}</li>}
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
                Opción 1 — Archivar (recomendado)
              </p>
              <p className="text-xs" style={{ color: 'var(--c-dim)' }}>
                El contacto desaparecerá de los listados pero se conserva el historial.
              </p>
              <button
                onClick={onArchive}
                className="self-start px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
                style={{ background: 'var(--c-navy)', color: '#fff' }}
              >
                Archivar contacto
              </button>
            </div>

            <div className="flex flex-col gap-2" style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1rem' }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#ea580c' }}>
                Opción 2 — Eliminar todo (irreversible)
              </p>
              <p className="text-xs" style={{ color: 'var(--c-dim)' }}>
                Borra el contacto <strong>y todos</strong> sus proyectos, cotizaciones, ventas y pagos. No se puede deshacer.
              </p>
              <label className="text-xs" style={{ color: 'var(--c-dim)' }}>
                Escribe <code style={{ background: 'var(--c-panel)', padding: '1px 6px', borderRadius: 4, color: 'var(--c-ink)' }}>{CONFIRM_WORD}</code> para habilitar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                className="text-sm px-3 py-2 rounded-lg font-mono outline-none"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
                placeholder={CONFIRM_WORD}
              />
              <button
                onClick={onDeleteCascade}
                disabled={!cascadeReady}
                className="self-start px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
                style={{
                  background: cascadeReady ? 'var(--c-rose)' : 'var(--c-panel)',
                  color: cascadeReady ? '#fff' : 'var(--c-ghost)',
                  border: cascadeReady ? 'none' : '1px solid var(--c-rim)',
                  cursor: cascadeReady ? 'pointer' : 'not-allowed',
                  opacity: cascadeReady ? 1 : 0.7,
                }}
              >
                Eliminar todo permanentemente
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
                style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
