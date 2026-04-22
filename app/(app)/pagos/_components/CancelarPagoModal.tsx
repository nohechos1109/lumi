'use client'

import { useState } from 'react'
import type { CustomerPayment } from '@/lib/queries/customer-payments'

import { fmtMXN } from '@/lib/formatters'

interface Props {
  payment: CustomerPayment
  onClose: () => void
  onCancelled: () => void
}

export default function CancelarPagoModal({ payment, onClose, onCancelled }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasApplications = Number(payment.amount_applied ?? 0) > 0.005

  async function handleCancel() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/pagos/${payment.id}`, { method: 'DELETE' })
      if (res.ok) {
        onCancelled()
        onClose()
      } else {
        const d = await res.json()
        setError(d.error ?? 'Error al cancelar pago')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(27,52,97,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold" style={{ color: 'var(--c-ink)' }}>Cancelar pago</h2>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        <p className="text-sm mb-4" style={{ color: 'var(--c-dim)' }}>
          ¿Confirmas cancelar el pago <span className="font-mono font-semibold">{payment.number}</span> de{' '}
          <span className="font-semibold">{payment.customer_name}</span> por{' '}
          <span className="font-mono font-semibold">${fmtMXN(payment.amount)}</span>?
        </p>

        {hasApplications && (
          <div className="rounded-lg px-3 py-2.5 mb-4"
            style={{ background: '#FEF3C7', border: '1px solid #FDE68A' }}>
            <p className="text-xs font-semibold" style={{ color: '#92400E' }}>
              ⚠️ Este pago tiene ${fmtMXN(payment.amount_applied)} aplicado a notas.
            </p>
            <p className="text-xs mt-1" style={{ color: '#78350F' }}>
              Al cancelar, las notas recuperarán su saldo pendiente automáticamente.
            </p>
          </div>
        )}

        {error && <p className="text-xs mb-3" style={{ color: '#BE123C' }}>{error}</p>}

        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
            style={{ background: 'var(--c-rim)', color: 'var(--c-ink)' }}>
            No cancelar
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-40"
            style={{ background: '#BE123C', color: '#fff' }}>
            {loading ? 'Cancelando…' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    </div>
  )
}
