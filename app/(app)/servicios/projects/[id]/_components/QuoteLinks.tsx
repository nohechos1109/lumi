import Link from 'next/link'

interface Props {
  quoteId: string
  showQuoteLink: boolean
}

export default function QuoteLinks({ quoteId, showQuoteLink }: Props) {
  return (
    <div
      className="mt-6 rounded-xl px-5 py-4 flex items-center gap-3 flex-wrap"
      style={{ background: 'var(--c-panel)', border: '1px solid var(--c-rim)' }}
    >
      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>
        Cotización origen
      </span>

      <Link
        href={`/api/pdf/${quoteId}/levantamiento`}
        target="_blank"
        className="text-sm font-semibold underline"
        style={{ color: 'var(--c-navy)' }}
      >
        Levantamiento PDF ↗
      </Link>

      {showQuoteLink && (
        <Link
          href={`/quotes/${quoteId}`}
          className="text-sm font-semibold underline"
          style={{ color: 'var(--c-navy)' }}
        >
          Ver cotización ↗
        </Link>
      )}
    </div>
  )
}
