'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast, notifyRefresh } from '@/lib/toast'
import RegisterPaymentModal from '@/components/ui/RegisterPaymentModal'
import ApplyPaymentModal from '@/components/ui/ApplyPaymentModal'
import PaymentScheduleModal from '@/components/ui/PaymentScheduleModal'

interface Sale {
  id: string
  number: string
  state: string
  amount_untaxed: string
  amount_tax: string
  amount_total: string
  amount_paid: string
  amount_balance: string
  unit_count: number
}

interface SaleNote {
  id: string
  number: string
  state: string
  concept: string | null
  amount_total: string
  amount_paid: string
  amount_balance: string
  created_at: string
}

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
  confirmed_by_name?: string
  created_at: string
}

interface ScheduleItem {
  id: string
  due_date: string
  amount: string
  label: string | null
  sequence: number
}

interface Props {
  sale: Sale
  notes: SaleNote[]
  payments: Payment[]
  schedule: ScheduleItem[]
  role: string
}

const fmt = (v: string | number) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })

const METHOD_LABELS: Record<string, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
}

const NOTE_STATE: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Borrador',   bg: '#FEF9EC', text: '#B45309' },
  confirmed: { label: 'Confirmada', bg: '#E0F2FE', text: '#0369A1' },
  paid:      { label: 'Pagada',     bg: '#DCFCE7', text: '#15803D' },
  cancelled: { label: 'Cancelada',  bg: '#FFE4E6', text: '#BE123C' },
}

const PAY_STATE: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Borrador',   bg: '#FEF9EC', text: '#B45309' },
  confirmed: { label: 'Confirmado', bg: '#DCFCE7', text: '#15803D' },
  cancelled: { label: 'Cancelado',  bg: '#FFE4E6', text: '#BE123C' },
}

export default function SaleDetail({ sale, notes, payments, schedule, role }: Props) {
  const router = useRouter()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [applyPaymentId, setApplyPaymentId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const canManage = role === 'manager' || role === 'admin'
  const canRegister = role === 'sales' || role === 'manager' || role === 'admin'
  const isActive = sale.state === 'active'

  const paidPct = Number(sale.amount_total) > 0
    ? Math.min(100, (Number(sale.amount_paid) / Number(sale.amount_total)) * 100)
    : 0

  // Next due date from schedule
  const today = new Date().toISOString().slice(0, 10)
  const nextDue = schedule.find(s => s.due_date >= today)

  async function confirmPayment(paymentId: string) {
    setLoading(paymentId)
    try {
      const res = await fetch(`/api/sales/${sale.id}/payments/${paymentId}/confirm`, { method: 'POST' })
      if (res.ok) {
        toast('Pago confirmado')
        notifyRefresh()
        router.refresh()
      } else {
        const d = await res.json()
        toast(d.error ?? 'Error', 'error')
      }
    } finally {
      setLoading(null)
    }
  }

  async function cancelPayment(paymentId: string) {
    if (!confirm('¿Cancelar este pago? Se revertirán las aplicaciones.')) return
    setLoading(paymentId)
    try {
      const res = await fetch(`/api/sales/${sale.id}/payments/${paymentId}/cancel`, { method: 'POST' })
      if (res.ok) {
        toast('Pago cancelado')
        notifyRefresh()
        router.refresh()
      } else {
        const d = await res.json()
        toast(d.error ?? 'Error', 'error')
      }
    } finally {
      setLoading(null)
    }
  }

  async function cancelSale() {
    if (!confirm('¿Cancelar esta venta? Esta acción no se puede deshacer.')) return
    setLoading('cancel-sale')
    try {
      const res = await fetch(`/api/sales/${sale.id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'cancelled' }),
      })
      if (res.ok) {
        toast('Venta cancelada')
        notifyRefresh()
        router.refresh()
      } else {
        const d = await res.json()
        toast(d.error ?? 'Error', 'error')
      }
    } finally {
      setLoading(null)
    }
  }

  const cardStyle = {
    background: 'var(--c-card)',
    border: '1px solid var(--c-rim)',
    boxShadow: '0 1px 3px rgba(27,52,97,0.05)',
  }

  return (
    <>
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-7">
        <StatCard label="Subtotal" value={`$${fmt(sale.amount_untaxed)}`} />
        <StatCard label="IVA" value={`$${fmt(sale.amount_tax)}`} />
        <StatCard label="Total" value={`$${fmt(sale.amount_total)}`} highlight />
        <StatCard label="Pagado" value={`$${fmt(sale.amount_paid)}`} sub={`${paidPct.toFixed(0)}%`} progress={paidPct} />
        <StatCard
          label="Saldo"
          value={`$${fmt(sale.amount_balance)}`}
          sub={nextDue ? `Próximo: ${new Date(nextDue.due_date + 'T12:00:00').toLocaleDateString('es-MX')}` : undefined}
          alert={Number(sale.amount_balance) > 0}
        />
      </div>

      {/* Actions row */}
      {isActive && (
        <div className="flex gap-2 flex-wrap mb-7">
          {canRegister && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="text-sm px-4 py-2 rounded-xl font-semibold transition-opacity hover:opacity-85"
              style={{ background: '#059669', color: '#fff' }}
            >
              + Registrar Pago
            </button>
          )}
          {canManage && (
            <button
              onClick={() => setShowScheduleModal(true)}
              className="text-sm px-4 py-2 rounded-xl font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--c-panel)', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
            >
              Definir Convenio
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={cancelSale}
              disabled={loading === 'cancel-sale'}
              className="text-sm px-4 py-2 rounded-xl font-semibold transition-opacity hover:opacity-80"
              style={{ background: 'var(--c-panel)', color: '#BE123C', border: '1px solid var(--c-rim)' }}
            >
              Cancelar Venta
            </button>
          )}
        </div>
      )}

      {/* ═══ NOTAS SECTION ═══ */}
      <Section title="Notas">
        {notes.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--c-ghost)' }}>Sin notas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Número</th>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Concepto</th>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
                  <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Total</th>
                  <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Pagado</th>
                  <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {notes.map(n => {
                  const ns = NOTE_STATE[n.state] ?? NOTE_STATE.draft
                  return (
                    <tr key={n.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                      <td className="px-3 py-2.5 font-mono font-medium" style={{ color: 'var(--c-ink)' }}>{n.number}</td>
                      <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>{n.concept || '—'}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: ns.bg, color: ns.text }}>
                          {ns.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(n.amount_total)}</td>
                      <td className="px-3 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(n.amount_paid)}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold" style={{ color: Number(n.amount_balance) > 0 ? '#B45309' : '#15803D' }}>
                        ${fmt(n.amount_balance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ═══ PAGOS SECTION ═══ */}
      <Section title="Pagos">
        {payments.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--c-ghost)' }}>Sin pagos registrados</p>
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
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const ps = PAY_STATE[p.state] ?? PAY_STATE.draft
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                      <td className="px-3 py-2.5 font-mono font-medium" style={{ color: 'var(--c-ink)' }}>{p.number}</td>
                      <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>
                        {new Date(p.payment_date + 'T12:00:00').toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>{p.concept || '—'}</td>
                      <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>{METHOD_LABELS[p.payment_method] ?? p.payment_method}</td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>${fmt(p.amount)}</td>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: ps.bg, color: ps.text }}>
                          {ps.label}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          {p.state === 'draft' && canManage && (
                            <button
                              onClick={() => confirmPayment(p.id)}
                              disabled={loading === p.id}
                              className="text-xs px-2 py-1 rounded font-semibold transition-opacity hover:opacity-80"
                              style={{ background: '#059669', color: '#fff' }}
                            >
                              Confirmar
                            </button>
                          )}
                          {p.state === 'confirmed' && canManage && (
                            <button
                              onClick={() => setApplyPaymentId(p.id)}
                              className="text-xs px-2 py-1 rounded font-semibold transition-opacity hover:opacity-80"
                              style={{ background: 'var(--c-navy)', color: '#fff' }}
                            >
                              Aplicar
                            </button>
                          )}
                          {p.state !== 'cancelled' && canManage && (
                            <button
                              onClick={() => cancelPayment(p.id)}
                              disabled={loading === p.id}
                              className="text-xs px-2 py-1 rounded font-semibold transition-opacity hover:opacity-80"
                              style={{ color: '#BE123C' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ═══ CONVENIO SECTION ═══ */}
      <Section title="Convenio de Pago">
        {schedule.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--c-ghost)' }}>
            Sin convenio definido
            {canManage && isActive && (
              <button
                onClick={() => setShowScheduleModal(true)}
                className="ml-2 font-semibold transition-opacity hover:opacity-80"
                style={{ color: '#059669' }}
              >
                Crear convenio
              </button>
            )}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>#</th>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Fecha</th>
                  <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Importe</th>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Etiqueta</th>
                  <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(s => {
                  const overdue = s.due_date < today
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                      <td className="px-3 py-2.5" style={{ color: 'var(--c-ghost)' }}>{s.sequence}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: overdue ? '#BE123C' : 'var(--c-ink)' }}>
                        {new Date(s.due_date + 'T12:00:00').toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>${fmt(s.amount)}</td>
                      <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>{s.label || '—'}</td>
                      <td className="px-3 py-2.5">
                        {overdue ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#FFE4E6', color: '#BE123C' }}>Vencido</span>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#E0F2FE', color: '#0369A1' }}>Pendiente</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Modals */}
      {showPaymentModal && (
        <RegisterPaymentModal
          saleId={sale.id}
          onClose={() => setShowPaymentModal(false)}
          onCreated={() => {
            setShowPaymentModal(false)
            toast('Pago registrado')
            notifyRefresh()
            router.refresh()
          }}
        />
      )}

      {applyPaymentId && (
        <ApplyPaymentModal
          saleId={sale.id}
          paymentId={applyPaymentId}
          notes={notes.filter(n => n.state === 'confirmed' && Number(n.amount_balance) > 0)}
          onClose={() => setApplyPaymentId(null)}
          onApplied={() => {
            setApplyPaymentId(null)
            toast('Pago aplicado')
            notifyRefresh()
            router.refresh()
          }}
        />
      )}

      {showScheduleModal && (
        <PaymentScheduleModal
          saleId={sale.id}
          saleTotal={Number(sale.amount_total)}
          currentSchedule={schedule}
          onClose={() => setShowScheduleModal(false)}
          onSaved={() => {
            setShowScheduleModal(false)
            toast('Convenio guardado')
            notifyRefresh()
            router.refresh()
          }}
        />
      )}
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl mb-6 overflow-hidden"
      style={{
        background: 'var(--c-card)',
        border: '1px solid var(--c-rim)',
        boxShadow: '0 1px 3px rgba(27,52,97,0.05)',
      }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--c-rim)' }}>
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>{title}</h2>
      </div>
      <div className="p-0">{children}</div>
    </div>
  )
}

function StatCard({ label, value, sub, highlight, progress, alert }: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
  progress?: number
  alert?: boolean
}) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: highlight ? 'var(--c-navy)' : 'var(--c-card)',
        border: `1px solid ${highlight ? 'var(--c-navy)' : 'var(--c-rim)'}`,
        boxShadow: highlight ? '0 2px 8px rgba(27,52,97,0.18)' : '0 1px 3px rgba(27,52,97,0.05)',
      }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: highlight ? 'rgba(255,255,255,0.6)' : 'var(--c-ghost)' }}>
        {label}
      </p>
      <p
        className="font-mono text-lg font-bold"
        style={{ color: highlight ? '#fff' : alert ? '#B45309' : 'var(--c-ink)' }}
      >
        {value}
      </p>
      {progress !== undefined && (
        <div className="w-full h-1.5 rounded-full mt-2 overflow-hidden" style={{ background: highlight ? 'rgba(255,255,255,0.2)' : 'var(--c-rim)' }}>
          <div className="h-full rounded-full" style={{ width: `${progress}%`, background: progress >= 100 ? '#15803D' : '#059669' }} />
        </div>
      )}
      {sub && (
        <p className="text-xs mt-1" style={{ color: highlight ? 'rgba(255,255,255,0.5)' : 'var(--c-ghost)' }}>{sub}</p>
      )}
    </div>
  )
}
