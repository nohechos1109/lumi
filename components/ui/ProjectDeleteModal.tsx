'use client'

import { useEffect, useState } from 'react'

export interface ProjectDeps {
  quotes: number
  sales: number
  sale_amount_total: number
  total_hard: number
}

interface Props {
  projectName: string
  deps: ProjectDeps | null
  loading: boolean
  onCancel: () => void
  onArchive?: () => void
  onDeletePreserve: () => void
  onDeleteCascade: () => void
}

function formatMXN(n: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0)
}

export default function ProjectDeleteModal({
  projectName,
  deps,
  loading,
  onCancel,
  onArchive,
  onDeletePreserve,
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
        className="w-full max-w-lg md:max-w-3xl rounded-2xl p-6 md:p-8 flex flex-col gap-5 md:gap-6"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          <h2 className="text-lg md:text-2xl font-bold mb-1" style={{ color: 'var(--c-ink)' }}>
            Eliminar proyecto
          </h2>
          <p className="text-sm md:text-base font-semibold" style={{ color: 'var(--c-dim)' }}>
            {projectName}
          </p>
        </div>

        {loading && (
          <p className="text-sm md:text-base font-mono uppercase tracking-widest text-center py-4 md:py-8" style={{ color: 'var(--c-ghost)' }}>
            Revisando dependencias...
          </p>
        )}

        {!loading && deps && !hasDeps && (
          <>
            <p className="text-sm md:text-base" style={{ color: 'var(--c-ink)' }}>
              Este proyecto no tiene cotizaciones ni ventas asociadas.
            </p>
            <p className="text-xs md:text-sm" style={{ color: 'var(--c-ghost)' }}>
              Se eliminará permanentemente. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={onCancel}
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-[15px] transition-opacity hover:opacity-75"
                style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
              >
                Cancelar
              </button>
              <button
                autoFocus
                onClick={onDeletePreserve}
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-[15px] font-semibold transition-opacity hover:opacity-85"
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
              className="rounded-xl p-4 md:p-5 text-sm md:text-base"
              style={{ background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.25)', color: 'var(--c-ink)' }}
            >
              <p className="font-semibold mb-2 md:text-base" style={{ color: '#ea580c' }}>
                Este proyecto tiene registros asociados:
              </p>
              <ul className="space-y-1 text-xs md:text-sm font-mono">
                {deps.quotes > 0 && <li>• {deps.quotes} cotización{deps.quotes === 1 ? '' : 'es'}</li>}
                {deps.sales > 0  && <li>• {deps.sales} venta{deps.sales === 1 ? '' : 's'} ({formatMXN(deps.sale_amount_total)})</li>}
              </ul>
            </div>

            {onArchive && (
              <div className="flex flex-col gap-2 md:gap-3">
                <p className="text-xs md:text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
                  Opción 1 — Archivar (recomendado)
                </p>
                <p className="text-xs md:text-sm" style={{ color: 'var(--c-dim)' }}>
                  El proyecto desaparece de los listados pero conserva cotizaciones y ventas.
                </p>
                <button
                  onClick={onArchive}
                  className="self-start px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-[15px] font-semibold transition-opacity hover:opacity-85"
                  style={{ background: 'var(--c-navy)', color: '#fff' }}
                >
                  Archivar proyecto
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2 md:gap-3" style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1rem' }}>
              <p className="text-xs md:text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--c-ink)' }}>
                Opción {onArchive ? '2' : '1'} — Eliminar preservando historial
              </p>
              <p className="text-xs md:text-sm" style={{ color: 'var(--c-dim)' }}>
                Borra el proyecto. Las cotizaciones y ventas existentes permanecen sin enlace.
              </p>
              <button
                onClick={onDeletePreserve}
                className="self-start px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-[15px] font-semibold transition-opacity hover:opacity-85"
                style={{ background: 'var(--c-rose-bg)', color: 'var(--c-rose)', border: '1px solid rgba(220,38,38,0.25)' }}
              >
                Eliminar proyecto
              </button>
            </div>

            <div className="flex flex-col gap-2 md:gap-3" style={{ borderTop: '1px solid var(--c-rim)', paddingTop: '1rem' }}>
              <p className="text-xs md:text-sm font-semibold uppercase tracking-widest" style={{ color: '#ea580c' }}>
                Opción {onArchive ? '3' : '2'} — Eliminar todo (irreversible)
              </p>
              <p className="text-xs md:text-sm" style={{ color: 'var(--c-dim)' }}>
                Borra el proyecto <strong>y todas</strong> sus cotizaciones, ventas y pagos. No se puede deshacer.
              </p>
              <label className="text-xs md:text-sm" style={{ color: 'var(--c-dim)' }}>
                Escribe <code style={{ background: 'var(--c-panel)', padding: '1px 6px', borderRadius: 4, color: 'var(--c-ink)' }}>{CONFIRM_WORD}</code> para habilitar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                className="text-sm md:text-[15px] px-3 md:px-4 py-2 md:py-3 rounded-lg font-mono outline-none"
                style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)' }}
                placeholder={CONFIRM_WORD}
              />
              <button
                onClick={onDeleteCascade}
                disabled={!cascadeReady}
                className="self-start px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-[15px] font-semibold transition-opacity"
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
                className="px-4 md:px-5 py-2 md:py-2.5 rounded-lg text-sm md:text-[15px] transition-opacity hover:opacity-75"
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
