import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnQuotesOnly, canAccessShowroomQuotes } from '@/lib/permissions'
import { listQuotesByUser, listProjectQuotesByUser, listAllQuotes } from '@/lib/queries/quotes'
import QuotesTable from './_components/QuotesTable'
import ShowroomButton from './_components/ShowroomButton'

export default async function QuotesPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const quotes = canViewOwnQuotesOnly(session.role)
    ? canAccessShowroomQuotes(session.role)
      ? await listQuotesByUser(session.userId)
      : await listProjectQuotesByUser(session.userId)
    : await listAllQuotes()

  const title = canViewOwnQuotesOnly(session.role) ? 'Mis Cotizaciones' : 'Cotizaciones'

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}>
            Cotizaciones
          </p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
            {title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
            {quotes.length} {quotes.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>
        {canAccessShowroomQuotes(session.role) && <ShowroomButton />}
      </div>

      <QuotesTable quotes={quotes} role={session.role} />
    </div>
  )
}
