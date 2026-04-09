import Link from 'next/link'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { canViewOwnQuotesOnly } from '@/lib/permissions'
import { listQuotesByUser, listAllQuotes } from '@/lib/queries/quotes'
import QuotesTable from './_components/QuotesTable'

export default async function QuotesPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const quotes = canViewOwnQuotesOnly(session.role)
    ? await listQuotesByUser(session.userId)
    : await listAllQuotes()

  const title = canViewOwnQuotesOnly(session.role) ? 'Mis Cotizaciones' : 'Cotizaciones'

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1
            className="font-heading text-3xl font-bold"
            style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
          >
            {title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
            {quotes.length} {quotes.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition-opacity hover:opacity-85 self-start"
          style={{ background: '#0B9962', color: '#FFFFFF', letterSpacing: '0.08em' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          Venta de Mostrador
        </Link>
      </div>

      <QuotesTable quotes={quotes} role={session.role} />
    </div>
  )
}
