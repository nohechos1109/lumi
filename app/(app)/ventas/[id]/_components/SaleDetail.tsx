// Server Component — read-only view
import Link from 'next/link'
import { canCreateSaleNotes, canManagePaymentSchedule } from '@/lib/permissions'
import SalePaymentsSection from './SalePaymentsSection'
import ScheduleModal from './ScheduleModal'
import NotesTable from './NotesTable'

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
  unit_name: string | null
  amount_untaxed: string
  amount_tax: string
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
  overdue: boolean
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

export default function SaleDetail({ sale, notes, payments, schedule, applications, role }: Props) {
  const activeNotes = notes.filter(n => n.state !== 'cancelled')
  const notesUntaxed = activeNotes.reduce((s, n) => s + Number(n.amount_untaxed), 0)
  const notesTax     = activeNotes.reduce((s, n) => s + Number(n.amount_tax), 0)
  const notesTotal   = activeNotes.reduce((s, n) => s + Number(n.amount_total), 0)
  const notesPaid    = activeNotes.reduce((s, n) => s + Number(n.amount_paid), 0)
  const notesBalance = activeNotes.reduce((s, n) => s + Number(n.amount_balance), 0)

  const paidPct = notesTotal > 0
    ? Math.min(100, (notesPaid / notesTotal) * 100)
    : 0

  const today = new Date().toISOString().slice(0, 10)
  const normDate = (d: string | Date) => d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10)
  const nextDue = schedule.find(s => normDate(s.due_date) >= today && s.state !== 'paid')

  return (
    <>
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-7">
        <StatCard label="Subtotal" value={`$${fmt(notesUntaxed)}`} />
        <StatCard label="IVA" value={`$${fmt(notesTax)}`} />
        <StatCard label="Total" value={`$${fmt(notesTotal)}`} highlight />
        <StatCard label="Pagado" value={`$${fmt(notesPaid)}`} sub={`${paidPct.toFixed(0)}%`} progress={paidPct} />
        <StatCard
          label="Saldo"
          value={`$${fmt(notesBalance)}`}
          sub={nextDue ? `Próximo: ${new Date(normDate(nextDue.due_date) + 'T12:00:00').toLocaleDateString('es-MX')}` : undefined}
          alert={notesBalance > 0}
        />
      </div>

      {/* ═══ NOTAS SECTION ═══ */}
      <Section title="Notas" action={
        canCreateSaleNotes(role) && (sale.state === 'active' || sale.state === 'paid') ? (
          <Link
            href={`/ventas/${sale.id}/notas/nueva`}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
            style={{ background: 'var(--c-navy)', color: '#fff' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nueva nota
          </Link>
        ) : undefined
      }>
        <NotesTable notes={notes} saleId={sale.id} />
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
      <Section title="Convenio de Pago" action={
        canManagePaymentSchedule(role) ? (
          <ScheduleModal saleId={sale.id} initialItems={schedule} />
        ) : undefined
      }>
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

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl mb-6 overflow-hidden"
      style={{
        background: 'var(--c-card)',
        border: '1px solid var(--c-rim)',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--c-rim)' }}>
        <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--c-ghost)' }}>{title}</h2>
        {action}
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
        boxShadow: highlight ? '0 2px 8px rgba(37,99,235,0.18)' : '0 1px 3px rgba(15,23,42,0.04)',
      }}
    >
      <p className="text-xs font-semibold mb-2" style={{ color: highlight ? 'rgba(255,255,255,0.6)' : 'var(--c-ghost)' }}>
        {label}
      </p>
      <p
        className="font-mono text-lg font-bold"
        style={{ color: highlight ? '#fff' : alert ? 'var(--c-gold)' : 'var(--c-ink)' }}
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
