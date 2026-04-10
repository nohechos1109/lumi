import Link from 'next/link'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { notFound } from 'next/navigation'
import { sessionOptions, SessionData } from '@/lib/session'
import { canCreateSaleNotes } from '@/lib/permissions'
import { getSale } from '@/lib/queries/sales'
import { listLines } from '@/lib/queries/quote_lines'
import NewNoteForm from './_components/NewNoteForm'

export default async function NewNotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!canCreateSaleNotes(session.role)) notFound()

  const sale = await getSale(id)
  if (!sale) notFound()
  if (sale.state !== 'active') notFound()

  const quoteLines = sale.quote_id
    ? (await listLines(sale.quote_id)).filter(l => l.display_type === 'product' && Number(l.qty) > 0)
    : []

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

      <div className="mb-7">
        <h1 className="font-heading text-3xl font-bold mb-1" style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}>
          Nueva Nota
        </h1>
        <p className="text-sm" style={{ color: 'var(--c-dim)' }}>
          {sale.customer_name} · Total venta: ${Number(sale.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} · Saldo: ${Number(sale.amount_balance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
      </div>

      <NewNoteForm sale={sale} role={session.role} quoteLines={quoteLines} />
    </div>
  )
}
