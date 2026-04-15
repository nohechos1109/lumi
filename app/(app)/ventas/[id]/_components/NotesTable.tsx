'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SaleNote {
  id: string
  number: string
  state: string
  concept: string | null
  unit_name: string | null
  amount_total: string
  amount_paid: string
  amount_balance: string
}

const NOTE_STATE: Record<string, { label: string; bg: string; text: string }> = {
  draft:     { label: 'Borrador',   bg: '#FEF9EC', text: '#B45309' },
  confirmed: { label: 'Confirmada', bg: '#E0F2FE', text: '#0369A1' },
  paid:      { label: 'Pagada',     bg: '#DCFCE7', text: '#15803D' },
  cancelled: { label: 'Cancelada',  bg: '#FFE4E6', text: '#BE123C' },
}

const fmt = (v: string | number) => Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })

async function changeNoteState(saleId: string, noteId: string, state: string) {
  const res = await fetch(`/api/sales/${saleId}/notes/${noteId}/state`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ state }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error ?? `Error ${res.status}`)
  }
}

export default function NotesTable({ notes, saleId }: { notes: SaleNote[]; saleId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleStateChange(noteId: string, state: string) {
    setBusy(noteId + state)
    setError(null)
    try {
      await changeNoteState(saleId, noteId, state)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  if (notes.length === 0) {
    return <p className="text-sm py-4 text-center" style={{ color: 'var(--c-ghost)' }}>Sin notas</p>
  }

  return (
    <>
      {error && (
        <p className="text-xs mx-3 mt-2 px-3 py-2 rounded-lg" style={{ background: '#FFE4E6', color: '#BE123C' }}>
          {error}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
              <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Número</th>
              <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Unidad</th>
              <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Concepto</th>
              <th className="text-left px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Estado</th>
              <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Total</th>
              <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Pagado</th>
              <th className="text-right px-3 py-2 font-semibold" style={{ color: 'var(--c-ghost)' }}>Saldo</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {notes.map(n => {
              const ns = NOTE_STATE[n.state] ?? NOTE_STATE.draft
              return (
                <tr
                  key={n.id}
                  onClick={() => router.push(`/ventas/${saleId}/notas/${n.id}`)}
                  style={{ borderBottom: '1px solid var(--c-rim)', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-panel)')}
                  onMouseLeave={e => (e.currentTarget.style.background = '')}
                >
                  <td className="px-3 py-2.5 font-mono font-medium" style={{ color: 'var(--c-ink)' }}>{n.number}</td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>{n.unit_name || '—'}</td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--c-dim)' }}>{n.concept || '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: ns.bg, color: ns.text }}>
                      {ns.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(n.amount_total)}</td>
                  <td className="px-3 py-2.5 text-right font-mono" style={{ color: 'var(--c-ink)' }}>${fmt(n.amount_paid)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold" style={{ color: Number(n.amount_balance) > 0 ? '#B45309' : '#15803D' }}>
                    ${fmt(n.amount_balance)}
                  </td>
                  <td className="px-3 py-2.5 text-right" onClick={e => e.stopPropagation()}>
                    <div className="inline-flex gap-2">
                      {n.state === 'draft' && (
                        <>
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => handleStateChange(n.id, 'confirmed')}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{ background: '#0369A1', color: '#fff' }}
                          >
                            {busy === n.id + 'confirmed' ? '…' : 'Confirmar'}
                          </button>
                          <button
                            type="button"
                            disabled={busy !== null}
                            onClick={() => handleStateChange(n.id, 'cancelled')}
                            className="text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{ background: '#FFE4E6', color: '#BE123C' }}
                          >
                            {busy === n.id + 'cancelled' ? '…' : 'Cancelar'}
                          </button>
                        </>
                      )}
                      {(n.state === 'confirmed' || n.state === 'paid') && (
                        <a
                          href={`/api/pdf/sale-note/${n.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                          style={{ background: 'var(--c-navy)', color: '#fff' }}
                          title="Generar Nota de Cobro PDF"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>
                          </svg>
                          Nota
                        </a>
                      )}
                      {(n.state === 'confirmed' || n.state === 'paid') && Number(n.amount_paid) > 0 && (
                        <a
                          href={`/api/pdf/sale-note/${n.id}/payments`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-opacity hover:opacity-80"
                          style={{ background: '#0369A1', color: '#fff' }}
                          title="Historial de pagos PDF"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                          </svg>
                          Pagos
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
