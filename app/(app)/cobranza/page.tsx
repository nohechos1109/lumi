import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnSalesOnly } from '@/lib/permissions'
import { listAllNotesForCobranza } from '@/lib/queries/sale-notes'
import { listAllSales, listSalesByUser } from '@/lib/queries/sales'
import CobranzaTable from './_components/CobranzaTable'

export default async function CobranzaPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  const ownOnly = canViewOwnSalesOnly(session.role)

  const [notes, sales] = await Promise.all([
    ownOnly ? listAllNotesForCobranza(session.userId) : listAllNotesForCobranza(),
    ownOnly ? listSalesByUser(session.userId)         : listAllSales(),
  ])

  // Solo ventas activas (con datos básicos para el selector)
  const activeSales = sales
    .filter(s => s.state === 'active')
    .map(s => ({ id: s.id, number: s.number, customer_name: s.customer_name ?? '' }))

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>Cobranza</p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
          Cobranza
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          {notes.length} nota{notes.length !== 1 ? 's' : ''}
        </p>
      </div>

      <CobranzaTable notes={notes} role={session.role} activeSales={activeSales} />
    </div>
  )
}
