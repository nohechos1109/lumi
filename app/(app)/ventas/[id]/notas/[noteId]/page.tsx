import Link from 'next/link'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnSalesOnly } from '@/lib/permissions'
import { getSale } from '@/lib/queries/sales'
import { getSaleNoteWithUnit, listNoteLines } from '@/lib/queries/sale-notes'
import { listLines } from '@/lib/queries/quote_lines'
import NoteDetailView from './_components/NoteDetailView'
import NoteActions from './_components/NoteActions'

const NOTE_STATE: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Borrador',   bg: '#FEF9EC', text: '#B45309' },
  confirmed: { label: 'Confirmada', bg: '#E0F2FE', text: '#0369A1' },
  paid:      { label: 'Pagada',     bg: '#DCFCE7', text: '#15803D' },
  cancelled: { label: 'Cancelada',  bg: '#FFE4E6', text: '#BE123C' },
}

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string; noteId: string }>
}) {
  const { id, noteId } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  const [sale, note] = await Promise.all([
    getSale(id),
    getSaleNoteWithUnit(noteId),
  ])

  if (!sale) notFound()
  if (!note || note.sale_id !== id) notFound()
  if (canViewOwnSalesOnly(session.role) && sale.user_id !== session.userId) notFound()

  const [lines, rawQuoteLines] = await Promise.all([
    listNoteLines(noteId),
    sale.quote_id ? listLines(sale.quote_id) : Promise.resolve([]),
  ])
  const globalDiscountLine = rawQuoteLines.find(l => l.display_type === 'discount')
  const globalDiscount = globalDiscountLine ? parseFloat(globalDiscountLine.discount_percent) : 0
  const quoteLines = rawQuoteLines.filter(l => l.display_type === 'product' && Number(l.qty) > 0)

  const ns = NOTE_STATE[note.state] ?? NOTE_STATE.draft

  return (
    <div>
      <div className="mb-5">
        <Link
          href={`/ventas/${id}`}
          className="text-xs font-bold uppercase tracking-widest transition-colors hover:opacity-75"
          style={{ color: 'var(--c-ghost)' }}
        >
          ← Volver a {sale.number}
        </Link>
      </div>

      {/* Header: title + badge (left) | actions (right) — like cotizaciones */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-7">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1
              className="font-heading text-3xl font-bold font-mono"
              style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
            >
              {note.number}
            </h1>
            <span
              className="text-xs font-bold px-3 py-1 rounded-full tracking-wide"
              style={{ background: ns.bg, color: ns.text }}
            >
              {ns.label}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--c-dim)' }}>
            {sale.customer_name} · Total venta: ${Number(sale.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} · Saldo: ${Number(sale.amount_balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Action buttons top-right */}
        <NoteActions
          noteId={noteId}
          noteState={note.state}
          amountPaid={note.amount_paid}
          saleId={id}
          role={session.role}
        />
      </div>

      <NoteDetailView
        note={note}
        lines={lines}
        saleId={id}
        role={session.role}
        quoteLines={quoteLines}
        globalDiscount={globalDiscount}
      />
    </div>
  )
}
