'use client'

import { useEffect } from 'react'
import type { QuoteLineStaleness } from '@/lib/queries/quote_lines'

export interface RefreshRow {
  line_id: string
  name: string
  has_manual: boolean
  old_effective: number
  old_suggested: number
  stale: QuoteLineStaleness | null
}

interface Props {
  title: string
  rows: RefreshRow[]
  mode: 'preserve_manual' | 'use_suggested'
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
}

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function reasonLabel(r: QuoteLineStaleness['reason']): string {
  switch (r) {
    case 'product': return 'Producto actualizado'
    case 'fx': return 'Tipo de cambio actualizado'
    case 'both': return 'Producto y TC actualizados'
    case 'product_deleted': return 'Producto no disponible'
    default: return ''
  }
}

export default function RefreshPricesModal({ title, rows, mode, onConfirm, onCancel, busy }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const hasAnyManual = rows.some(r => r.has_manual)
  const deltaSum = rows.reduce((acc, r) => {
    const newSuggested = r.stale?.new_suggested ?? r.old_suggested
    const newEff = mode === 'use_suggested' || !r.has_manual
      ? newSuggested
      : r.old_effective
    return acc + (newEff - r.old_effective)
  }, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[85vh]"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-3 flex items-center gap-3" style={{ borderBottom: '1px solid var(--c-rim)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <h3 className="text-base font-semibold" style={{ color: 'var(--c-ink)' }}>{title}</h3>
        </div>

        <div className="px-6 py-4 overflow-y-auto">
          {mode === 'preserve_manual' && hasAnyManual && (
            <p className="text-xs mb-3" style={{ color: 'var(--c-dim)' }}>
              Las líneas con precio manual conservarán su precio. Sólo se actualizarán costo base, tipo de cambio y margen.
            </p>
          )}
          {mode === 'use_suggested' && (
            <p className="text-xs mb-3" style={{ color: 'var(--c-dim)' }}>
              Se reemplazará el precio manual por el nuevo precio sugerido calculado con el costo y tipo de cambio actuales.
            </p>
          )}

          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-rim)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--c-panel)', borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="text-left px-3 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Línea</th>
                  <th className="text-left px-3 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Cambio</th>
                  <th className="text-right px-3 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Actual</th>
                  <th className="text-right px-3 py-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Nuevo</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const newSuggested = r.stale?.new_suggested ?? r.old_suggested
                  const keepsManual = mode === 'preserve_manual' && r.has_manual
                  const newEffective = keepsManual ? r.old_effective : newSuggested
                  const delta = newEffective - r.old_effective
                  const showDelta = Math.abs(delta) > 0.005
                  const hasFxInfo = r.stale != null && r.stale.new_fx != null &&
                    (r.stale.reason === 'fx' || r.stale.reason === 'both')
                  const reasonText = r.stale != null
                    ? reasonLabel(r.stale.reason)
                    : (mode === 'use_suggested' ? 'Reemplazar precio manual' : 'Sin cambios')

                  return (
                    <tr key={r.line_id} style={{ borderTop: '1px solid var(--c-rim)' }}>
                      <td className="px-3 py-2.5" style={{ color: 'var(--c-ink)' }}>
                        <div className="text-sm">{r.name}</div>
                        {r.has_manual && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>
                            Precio manual {keepsManual ? '(se conserva)' : '(se reemplaza)'}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs" style={{ color: '#B45309' }}>
                        {reasonText}
                        {hasFxInfo && r.stale && (
                          <div style={{ color: 'var(--c-ghost)' }}>
                            TC {Number(r.stale.old_fx).toFixed(2)} → {Number(r.stale.new_fx ?? 0).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm" style={{ color: 'var(--c-dim)' }}>
                        ${fmt(r.old_effective)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-sm" style={{ color: 'var(--c-ink)', fontWeight: 600 }}>
                        ${fmt(newEffective)}
                        {showDelta && (
                          <div className="text-xs font-mono" style={{ color: delta >= 0 ? 'var(--c-mint)' : 'var(--c-rose)' }}>
                            {delta >= 0 ? '+' : ''}${fmt(Math.abs(delta))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {rows.length > 1 && (
                <tfoot>
                  <tr style={{ borderTop: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}>
                    <td colSpan={3} className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--c-dim)' }}>
                      Cambio total en precios unitarios
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm font-semibold" style={{ color: deltaSum >= 0 ? 'var(--c-mint)' : 'var(--c-rose)' }}>
                      {deltaSum >= 0 ? '+' : ''}${fmt(Math.abs(deltaSum))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="px-6 py-4 flex gap-3 justify-end" style={{ borderTop: '1px solid var(--c-rim)' }}>
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75 disabled:opacity-50"
            style={{ background: 'transparent', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
          >
            Cancelar
          </button>
          <button
            autoFocus
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: '#B45309', color: '#FFFFFF' }}
          >
            {busy ? 'Actualizando...' : 'Confirmar actualización'}
          </button>
        </div>
      </div>
    </div>
  )
}
