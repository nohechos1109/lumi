import { notFound } from 'next/navigation'
import { getQuote } from '@/lib/queries/quotes'
import { listLines } from '@/lib/queries/quote_lines'
import Link from 'next/link'
import QuoteActions from '@/app/(app)/quotes/[id]/_components/QuoteActions'

export default async function ManagerQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const quote = await getQuote(id)
  if (!quote) notFound()
  const lines = await listLines(id)

  return (
    <div>
      <div className="flex items-start justify-between mb-7">
        <div>
          <Link
            href="/manager"
            className="text-xs font-mono mb-3 block transition-colors"
            style={{ color: 'var(--c-ghost)' }}
            onMouseEnter={undefined}
          >
            ← Volver
          </Link>
          <h1
            className="font-heading text-3xl font-bold uppercase"
            style={{ color: 'var(--c-ink)', letterSpacing: '0.1em' }}
          >
            {quote.number}
          </h1>
          <p className="text-sm mt-1 font-mono" style={{ color: 'var(--c-dim)' }}>
            {quote.customer_name}
            <span style={{ color: 'var(--c-ghost)', margin: '0 0.5rem' }}>·</span>
            {new Date(quote.quotation_date).toLocaleDateString('es-MX')}
          </p>
        </div>
        <QuoteActions quoteId={id} currentState={quote.state} role="manager" />
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Descripción</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Cantidad</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Precio</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Subtotal</th>
              <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Margen</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(line => (
              <tr
                key={line.id}
                className="tr-hover transition-colors"
                style={{ borderTop: '1px solid var(--c-rim)' }}
              >
                <td className="px-5 py-4" style={{ color: 'var(--c-ink)' }}>{line.name}</td>
                <td className="px-5 py-4 text-right font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                  {line.qty ?? '—'}
                </td>
                <td className="px-5 py-4 text-right font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                  ${Number(line.unit_price_mxn_effective).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-4 text-right font-mono font-medium" style={{ color: 'var(--c-ink)' }}>
                  ${Number(line.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-5 py-4 text-right">
                  {line.display_type === 'product' ? (
                    <span className="text-xs font-mono font-medium" style={{ color: Number(line.margin_amount) >= 0 ? 'var(--c-mint)' : 'var(--c-rose)' }}>
                      ${Number(line.margin_amount).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                      {Number(line.subtotal) > 0 && (
                        <span className="ml-1" style={{ color: 'var(--c-ghost)' }}>
                          ({((Number(line.margin_amount) / Number(line.subtotal)) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  ) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer totals */}
        <div
          className="px-5 py-4 flex justify-end gap-8 text-sm"
          style={{ borderTop: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}
        >
          <span style={{ color: 'var(--c-dim)' }}>
            Subtotal:{' '}
            <span className="font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>
              ${Number(quote.amount_untaxed).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </span>
          <span style={{ color: 'var(--c-dim)' }}>
            IVA:{' '}
            <span className="font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>
              ${Number(quote.amount_tax).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </span>
          <span
            className="font-mono font-bold px-4 py-1.5 rounded-xl"
            style={{
              background: 'var(--c-gold-bg)',
              color: 'var(--c-gold)',
              border: '1px solid var(--c-gold-bd)',
            }}
          >
            Total: ${Number(quote.amount_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </span>
          <span className="text-xs font-mono" style={{ color: Number(quote.margin_amount) >= 0 ? 'var(--c-mint)' : 'var(--c-rose)' }}>
            Margen: ${Number(quote.margin_amount).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
            {Number(quote.amount_untaxed) > 0 && (
              <> ({((Number(quote.margin_amount) / Number(quote.amount_untaxed)) * 100).toFixed(1)}%)</>  
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
