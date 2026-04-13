'use client'

import { useState, useMemo } from 'react'
import { METHOD_LABELS, PAYMENT_STATE_BADGE } from '@/lib/constants/payments'
import { fmtMXN, fmtDate } from '@/lib/formatters'

interface Payment {
  id: string
  number: string
  state: string
  concept: string | null
  amount: string
  payment_method: string
  payment_date: string
  reference: string | null
  registered_by_name?: string
  created_at: string
}

interface SalePaymentApplication {
  payment_id: string
  note_number: string
  note_id: string
  amount: string
}

interface NoteOption {
  id: string
  number: string
}

interface Props {
  payments: Payment[]
  applications: SalePaymentApplication[]
  notes: NoteOption[]
}

export default function SalePaymentsSection({ payments, applications, notes }: Props) {
  const [filterNote, setFilterNote] = useState('')

  // Group applications by payment_id
  const appsByPayment = useMemo(() => {
    const map: Record<string, SalePaymentApplication[]> = {}
    for (const app of applications) {
      if (!map[app.payment_id]) map[app.payment_id] = []
      map[app.payment_id].push(app)
    }
    return map
  }, [applications])

  // Build set of payment_ids that have an application to the selected note
  const filteredPayments = useMemo(() => {
    if (!filterNote) return payments
    const matchingPaymentIds = new Set(
      applications.filter(a => a.note_id === filterNote).map(a => a.payment_id)
    )
    return payments.filter(p => matchingPaymentIds.has(p.id))
  }, [payments, applications, filterNote])

  return (
    <>
      {/* Filter bar */}
      {notes.length > 1 && (
        <div className="px-4 py-2 flex items-center gap-3" style={{ borderBottom: '1px solid var(--c-rim)' }}>
          <label className="text-xs font-semibold" style={{ color: 'var(--c-ghost)' }}>Nota</label>
          <select
            value={filterNote}
            onChange={e => setFilterNote(e.target.value)}
            className="rounded-lg px-2.5 py-1.5 text-xs"
            style={{ background: 'var(--c-rim)', border: '1px solid var(--c-rim)', color: 'var(--c-ink)', outline: 'none' }}
          >
            <option value="">Todas</option>
            {notes.map(n => (
              <option key={n.id} value={n.id}>{n.number}</option>
            ))}
          </select>
          {filterNote && (
            <button
              onClick={() => setFilterNote('')}
              className="text-xs font-semibold px-2 py-1 rounded-lg hover:opacity-75 transition-opacity"
              style={{ background: '#FFE4E6', color: '#BE123C' }}
            >
              Limpiar
            </button>
          )}
          <span className="text-xs ml-auto" style={{ color: 'var(--c-ghost)' }}>
            {filteredPayments.length} / {payments.length}
          </span>
        </div>
      )}

      {/* Table */}
      {filteredPayments.length === 0 ? (
        <p className="text-sm py-4 text-center" style={{ color: 'var(--c-ghost)' }}>
          {filterNote ? 'Sin pagos para esta nota' : 'Sin pagos registrados'}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Número</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Fecha</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Concepto</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Método</th>
                <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Importe</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
                <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Aplicado a</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => {
                const ps = PAYMENT_STATE_BADGE[p.state] ?? PAYMENT_STATE_BADGE.confirmed
                const appsForPayment = appsByPayment[p.id] ?? []
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                    <td className="px-3 py-2.5 font-mono font-medium" style={{ color: 'var(--c-ink)' }}>{p.number}</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>{fmtDate(p.payment_date)}</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>{p.concept || '—'}</td>
                    <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>{METHOD_LABELS[p.payment_method] ?? p.payment_method}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>${fmtMXN(p.amount)}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: ps.bg, color: ps.color }}>
                        {ps.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {appsForPayment.length === 0 ? (
                        <span style={{ color: 'var(--c-ghost)', fontSize: '0.75rem' }}>—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {appsForPayment.map((a, i) => {
                            const active = filterNote === a.note_id
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full font-semibold"
                                style={{
                                  background: active ? '#1D4ED8' : '#EFF6FF',
                                  color: active ? '#fff' : '#1D4ED8',
                                }}
                              >
                                {a.note_number}
                                <span style={{ color: active ? 'rgba(255,255,255,0.7)' : '#3B82F6', fontWeight: 400 }}>
                                  ${fmtMXN(a.amount)}
                                </span>
                              </span>
                            )
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
