import Link from 'next/link'
import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import { listQuotesByUser } from '@/lib/queries/quotes'
import QuotesTable from './_components/QuotesTable'

export default async function QuotesPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  const quotes = await listQuotesByUser(session.userId)

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div>
          <h1
            className="font-heading text-3xl font-bold"
            style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
          >
            Mis Cotizaciones
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
            {quotes.length} {quotes.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="text-sm px-5 py-2.5 rounded-lg font-semibold transition-opacity hover:opacity-85"
          style={{
            background: 'var(--c-navy)',
            color: '#FFFFFF',
          }}
        >
          + Nueva Cotización
        </Link>
      </div>

      <QuotesTable quotes={quotes} />
    </div>
  )
}
