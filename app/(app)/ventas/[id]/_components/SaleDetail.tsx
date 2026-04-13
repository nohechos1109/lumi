// Server Component — read-only view
// All write actions live in /cobranza now.

import { METHOD_LABELS } from '@/lib/constants/payments'
import SalePaymentsSection from './SalePaymentsSection'

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

interface SalePaymentApplication {
  payment_id: string
  note_id: string
  note_number: string
  amount: string
}

interface ScheduleItem {
  id: string
  due_date: string
  amount: string
  label: string | null
  sequence: number
  state: 'pending' | 'paid'
}

interface Props {
  sale: Sale
  notes: SaleNote[]
  payments: Payment[]
  schedule: ScheduleItem[]
  applications: SalePaymentApplication[]
  role: string
}

const fmt = (v: string | number) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })

const NOTE_STATE: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Borrador',   bg: '#FEF9EC', text: '#B45309' },
  confirmed: { label: 'Confirmada', bg: '#E0F2FE', text: '#0369A1' },
  paid:      { label: 'Pagada',     bg: '#DCFCE7', text: '#15803D' },
  cancelled: { label: 'Cancelada',  bg: '#FFE4E6', text: '#BE123C' },
}

export default function SaleDetail({ sale, notes, payments, schedule, applications }: Props) {
  const paidPct = Number(sale.amount_total) > 0
    ? Math.min(100, (Number(sale.amount_paid) / Number(sale.amount_total)) * 100)
    : 0

  const today = new Date().toISOString().slice(0, 10)
  const normDate = (d: string | Date) => d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)
  const nextDue = schedule.find(s => normDate(s.due_date) >= today && s.state !== 'paid')

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
          sub={nextDue ? `Próximo: ${new Date(normDate(nextDue.due_date) + 'T12:00:00').toLocaleDateString('es-MX')}` : undefined}
          alert={Number(sale.amount_balance) > 0}
        />
      </div>

      {/* Info banner: read-only */}
      <div
        className="rounded-xl p-4 mb-6 flex items-start gap-3"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--c-navy)', flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--c-dim)' }}>
          Esta vista es de <strong>solo lectura</strong>. Para registrar abonos o crear nuevas notas, ve a la sección de{' '}
          <a href="/cobranza" className="font-bold hover:underline" style={{ color: 'var(--c-navy)' }}>Cobranza</a>.
        </p>
      </div>

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
                  <th className="px-3 py-2" />
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
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex gap-2">
                          {(n.state === 'confirmed' || n.state === 'paid') && (
                            <a
                              href={`/api/pdf/sale-note/${n.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                              style={{ background: 'var(--c-navy)', color: '#fff' }}
                              title="Generar Nota de Cobro PDF"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                              </svg>
                              Nota
                            </a>
                          )}
                          {(n.state === 'confirmed' || n.state === 'paid') && Number(n.amount_paid) > 0 && (
                            <a
                              href={`/api/pdf/sale-note/${n.id}/payments`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                              style={{ background: '#0369A1', color: '#fff' }}
                              title="Historial de pagos PDF"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                              </svg>
                              Pagos
                            </a>
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

      {/* ═══ PAGOS SECTION ═══ */}
      <Section title="Pagos">
        <SalePaymentsSection
          saleId={sale.id}
          payments={payments}
          applications={applications}
          notes={notes.map(n => ({ id: n.id, number: n.number }))}
        />
      </Section>

      {/* ═══ CONVENIO SECTION ═══ */}
      <Section title="Convenio de Pago">
        {schedule.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: 'var(--c-ghost)' }}>Sin convenio definido</p>
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
                  const overdue = normDate(s.due_date) < today
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--c-rim)' }}>
                      <td className="px-3 py-2.5" style={{ color: 'var(--c-ghost)' }}>{s.sequence}</td>
                      <td className="px-3 py-2.5 font-mono" style={{ color: overdue ? '#BE123C' : 'var(--c-ink)' }}>
                        {new Date(normDate(s.due_date) + 'T12:00:00').toLocaleDateString('es-MX')}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>${fmt(s.amount)}</td>
                      <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>{s.label || '—'}</td>
                      <td className="px-3 py-2.5">
                        {s.state === 'paid' ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#DCFCE7', color: '#15803D' }}>Pagado</span>
                        ) : overdue ? (
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
