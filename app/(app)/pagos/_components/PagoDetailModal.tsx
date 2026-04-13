'use client'

import { useState, useEffect } from 'react'
import type { CustomerPayment, PaymentApplication } from '@/lib/queries/customer-payments'

import { fmtMXN, fmtDate } from '@/lib/formatters'
import { METHOD_LABELS, PAYMENT_STATE_BADGE } from '@/lib/constants/payments'

interface Props {
  payment: CustomerPayment
  onClose: () => void
}

export default function PagoDetailModal({ payment, onClose }: Props) {
  const [applications, setApplications] = useState<PaymentApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/pagos/${payment.id}/applications`)
      .then(r => r.ok ? r.json() : [])
      .then(setApplications)
      .catch(() => setApplications([]))
      .finally(() => setLoading(false))
  }, [payment.id])

  const stateBadge = PAYMENT_STATE_BADGE[payment.state] ?? PAYMENT_STATE_BADGE.confirmed

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-6"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(27,52,97,0.18)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold font-mono" style={{ color: 'var(--c-ink)' }}>{payment.number}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--c-ghost)' }}>{payment.customer_name}</p>
          </div>
          <button onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--c-ghost)' }}>✕</button>
        </div>

        {/* Summary pills */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          <InfoPill label="MONTO" value={`$${fmtMXN(payment.amount)}`} color="var(--c-ink)" />
          <InfoPill label="DISPONIBLE" value={`$${fmtMXN(payment.amount_available)}`}
            color={Number(payment.amount_available) > 0.005 ? '#D97706' : '#15803D'} />
        </div>

        {/* Meta */}
        <div className="rounded-lg px-4 py-3 mb-5 grid grid-cols-2 gap-2"
          style={{ background: 'var(--c-rim)' }}>
          <MetaRow label="Fecha" value={fmtDate(payment.payment_date)} />
          <MetaRow label="Método" value={METHOD_LABELS[payment.payment_method] ?? payment.payment_method} />
          <MetaRow label="Estado" value={stateBadge.label} valueColor={stateBadge.color} />
          <MetaRow label="Registrado por" value={payment.registered_by_name ?? '—'} />
          {payment.reference && <MetaRow label="Referencia" value={payment.reference} />}
          {payment.concept && <MetaRow label="Concepto" value={payment.concept} />}
        </div>

        {/* Applications */}
        <div>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--c-ghost)' }}>
            APLICACIONES ({loading ? '…' : applications.length})
          </p>
          {loading ? (
            <p className="text-xs py-4 text-center" style={{ color: 'var(--c-ghost)' }}>Cargando…</p>
          ) : applications.length === 0 ? (
            <p className="text-xs py-4 text-center" style={{ color: 'var(--c-ghost)' }}>Sin aplicaciones</p>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-rim)' }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: 'var(--c-rim)' }}>
                    <th className="px-3 py-1.5 text-left font-semibold" style={{ color: 'var(--c-ghost)' }}>REMISIÓN</th>
                    <th className="px-3 py-1.5 text-left font-semibold" style={{ color: 'var(--c-ghost)' }}>O.S.</th>
                    <th className="px-3 py-1.5 text-left font-semibold" style={{ color: 'var(--c-ghost)' }}>FECHA</th>
                    <th className="px-3 py-1.5 text-right font-semibold" style={{ color: 'var(--c-ghost)' }}>MONTO</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(a => (
                    <tr key={a.id} style={{ borderTop: '1px solid var(--c-rim)' }}>
                      <td className="px-3 py-2 font-mono font-medium" style={{ color: 'var(--c-ink)' }}>
                        {a.note_number ?? '—'}
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--c-dim)' }}>
                        {a.sale_number ?? '—'}
                      </td>
                      <td className="px-3 py-2" style={{ color: 'var(--c-dim)' }}>
                        {fmtDate(a.created_at)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold" style={{ color: '#15803D' }}>
                        ${fmtMXN(a.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-5">
          <button onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-75"
            style={{ background: 'var(--c-rim)', color: 'var(--c-ink)' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg px-3 py-2 text-center" style={{ background: 'var(--c-rim)' }}>
      <p className="text-xs mb-0.5" style={{ color: 'var(--c-ghost)' }}>{label}</p>
      <p className="text-sm font-mono font-bold" style={{ color }}>{value}</p>
    </div>
  )
}

function MetaRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div>
      <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>{label}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: valueColor ?? 'var(--c-ink)' }}>{value}</p>
    </div>
  )
}
