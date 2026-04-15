import Link from 'next/link'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import { canCreateSaleNotes } from '@/lib/permissions'
import { getSale } from '@/lib/queries/sales'
import { listLines } from '@/lib/queries/quote_lines'
import { getSettings } from '@/lib/queries/settings'
import NewNoteForm from './_components/NewNoteForm'
import NewNoteActions from './_components/NewNoteActions'

export default async function NewNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!canCreateSaleNotes(session.role)) notFound()

  const sale = await getSale(id)
  if (!sale) notFound()
  if (sale.state === 'finished' || sale.state === 'cancelled') notFound()

  const [rawQuoteLines, settings] = await Promise.all([
    sale.quote_id ? listLines(sale.quote_id) : Promise.resolve([]),
    getSettings(),
  ])
  const fxRate = Number(settings?.fx_mxn_per_usd ?? 17.85)
  const globalDiscountLine = rawQuoteLines.find(l => l.display_type === 'discount')
  const globalDiscount = globalDiscountLine ? parseFloat(globalDiscountLine.discount_percent) : 0
  const quoteLines = rawQuoteLines.filter(l => l.display_type === 'product' && Number(l.qty) > 0)

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-7">
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1" style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}>
            Nueva Nota
          </h1>
          <p className="text-sm" style={{ color: 'var(--c-dim)' }}>
            {sale.customer_name} · Total venta: ${Number(sale.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} · Saldo: ${Number(sale.amount_balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <NewNoteActions saleId={id} />
      </div>

      <NewNoteForm sale={sale} role={session.role} quoteLines={quoteLines} globalDiscount={globalDiscount} fxRate={fxRate} />
    </div>
  )
}
