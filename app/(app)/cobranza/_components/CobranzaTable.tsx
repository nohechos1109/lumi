'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CobranzaNote } from '@/lib/queries/sale-notes'
import { toast } from '@/lib/toast'
import AbonoModal from './AbonoModal'
import EditFieldsModal from './EditFieldsModal'
import NewNoteSaleSelector from './NewNoteSaleSelector'
import MultiAbonoModal from './MultiAbonoModal'
import AplicarCreditoModal from './AplicarCreditoModal'
import AplicarCreditoClienteModal from './AplicarCreditoClienteModal'
import { fmtMXN, fmtDate } from '@/lib/formatters'

// ── State badges ─────────────────────────────────────────────────────────────

const STATE_MAP: Record<string, { bg: string; text: string; label: string }> = {
  draft:     { bg: '#F3F4F6', text: '#6B7280', label: 'Borrador' },
  confirmed: { bg: '#E0F2FE', text: '#0369A1', label: 'Confirmada' },
  paid:      { bg: '#DCFCE7', text: '#15803D', label: 'Pagada' },
  cancelled: { bg: '#FFE4E6', text: '#BE123C', label: 'Cancelada' },
}

// ── Interfaces ────────────────────────────────────────────────────────────────

interface SaleOption {
  id: string
  number: string
  customer_name: string
}

interface Props {
  notes: CobranzaNote[]
  role: string
  activeSales: SaleOption[]
}

interface Filters {
  search: string
  dateFrom: string
  dateTo: string
  cliente: string
  estado: string
  agente: string
}

const EMPTY: Filters = {
  search: '', dateFrom: '', dateTo: '', cliente: '', estado: '', agente: '',
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CobranzaTable({ notes, role, activeSales }: Props) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [abonoNote, setAbonoNote]             = useState<CobranzaNote | null>(null)
  const [editNote, setEditNote]               = useState<CobranzaNote | null>(null)
  const [creditNote, setCreditNote]           = useState<CobranzaNote | null>(null)
  const [creditClienteNote, setCreditClienteNote] = useState<CobranzaNote | null>(null)
  const [showNewNote, setShowNewNote]         = useState(false)
  const [selected, setSelected]           = useState<Set<string>>(new Set())
  const [showMulti, setShowMulti]         = useState(false)
  const canCreateNote = role === 'manager' || role === 'admin' || role === 'sales'

  const setF = useCallback(<K extends keyof Filters>(key: K, val: string) =>
    setFilters(prev => ({ ...prev, [key]: val })), [])

  // Unique values for dropdowns
  const uniqueAgentes  = useMemo(() => [...new Set(notes.map(n => n.agente ?? '').filter(Boolean))].sort(), [notes])

  // Filtered rows
  const filtered = useMemo(() => notes.filter(n => {
    if (filters.search   && !n.remision.toLowerCase().includes(filters.search.toLowerCase()) &&
                            !n.orden_servicio.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (filters.dateFrom && n.fecha.slice(0, 10) < filters.dateFrom) return false
    if (filters.dateTo   && n.fecha.slice(0, 10) > filters.dateTo)   return false
    if (filters.cliente  && !n.cliente.toLowerCase().includes(filters.cliente.toLowerCase())) return false
    if (filters.estado   && n.state !== filters.estado)           return false
    if (filters.agente   && (n.agente ?? '') !== filters.agente)  return false
    return true
  }), [notes, filters])

  const totals = useMemo(() => ({
    total:   filtered.reduce((s, n) => s + Number(n.amount_total),   0),
    paid:    filtered.reduce((s, n) => s + Number(n.amount_paid),    0),
    balance: filtered.reduce((s, n) => s + Number(n.amount_balance), 0),
  }), [filtered])

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY)
  const canAbono   = role === 'manager' || role === 'admin'

  // ── Multi-selection (for splitting a payment across notes) ─────────
  // All selected notes must belong to the same customer.
  const selectionCustomerId = useMemo(() => {
    if (selected.size === 0) return null
    const firstId = selected.values().next().value
    return notes.find(n => n.id === firstId)?.customer_id ?? null
  }, [selected, notes])

  const selectedNotes = useMemo(
    () => notes.filter(n => selected.has(n.id)),
    [notes, selected]
  )

  const selectionBalance = useMemo(
    () => selectedNotes.reduce((s, n) => s + Number(n.amount_balance), 0),
    [selectedNotes]
  )

  const selectionCustomerName = useMemo(() => {
    if (!selectionCustomerId) return ''
    return notes.find(n => n.customer_id === selectionCustomerId)?.cliente ?? ''
  }, [selectionCustomerId, notes])

  const toggleSelect = useCallback((noteId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(noteId)) next.delete(noteId)
      else next.add(noteId)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  // A note is selectable if:
  // - It has balance > 0
  // - It's not cancelled
  // - If something is already selected, it must belong to the same customer
  function isSelectable(n: CobranzaNote) {
    if (Number(n.amount_balance) <= 0.005) return false
    if (n.state === 'cancelled') return false
    if (selectionCustomerId && n.customer_id !== selectionCustomerId) return false
    return true
  }

  return (
    <div>
      {/* ── Filter bar ─────────────────────────────────────────────────────── */}
      <div className="rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>

        {/* Búsqueda global */}
        <FilterField label="Remisión / O.S.">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--c-ghost)' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Buscar..." value={filters.search}
              onChange={e => setF('search', e.target.value)}
              className="rounded-lg pl-8 pr-3 py-1.5 text-xs w-40"
              style={inputStyle} />
          </div>
        </FilterField>

        {/* Rango de fecha */}
        <FilterField label="Fecha">
          <div className="flex items-center gap-1.5">
            <input type="date" value={filters.dateFrom} onChange={e => setF('dateFrom', e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-xs w-36" style={inputStyle} />
            <span className="text-xs" style={{ color: 'var(--c-ghost)' }}>—</span>
            <input type="date" value={filters.dateTo} onChange={e => setF('dateTo', e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-xs w-36" style={inputStyle} />
          </div>
        </FilterField>

        {/* Cliente */}
        <FilterField label="Cliente">
          <input type="text" placeholder="Nombre..." value={filters.cliente}
            onChange={e => setF('cliente', e.target.value)}
            className="rounded-lg px-2.5 py-1.5 text-xs w-36" style={inputStyle} />
        </FilterField>

        {/* Estado */}
        <FilterField label="Estado">
          <SelectFilter value={filters.estado} onChange={v => setF('estado', v)}
            placeholder="Todos"
            options={['draft', 'confirmed', 'paid', 'cancelled']}
            labels={{ draft: 'Borrador', confirmed: 'Confirmada', paid: 'Pagada', cancelled: 'Cancelada' }} />
        </FilterField>

        {/* Agente */}
        {uniqueAgentes.length > 0 && (
          <FilterField label="Agente">
            <SelectFilter value={filters.agente} onChange={v => setF('agente', v)}
              placeholder="Todos" options={uniqueAgentes} />
          </FilterField>
        )}

        {/* Limpiar + contador + nueva nota */}
        <div className="flex items-end gap-3 ml-auto">
          <span className="text-xs pb-1.5" style={{ color: 'var(--c-ghost)' }}>
            {filtered.length} / {notes.length}
          </span>
          {hasFilters && (
            <button onClick={() => setFilters(EMPTY)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-75 transition-opacity"
              style={{ background: '#FFE4E6', color: '#BE123C' }}>
              Limpiar
            </button>
          )}
          {canCreateNote && (
            <button onClick={() => setShowNewNote(true)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-85 transition-opacity"
              style={{ background: 'var(--c-navy)', color: '#fff' }}>
              + Nueva Nota
            </button>
          )}
        </div>
      </div>

      {/* ── Selection toolbar ────────────────────────────────────────────── */}
      {selected.size > 0 && canAbono && (
        <div
          className="rounded-xl px-4 py-3 mb-4 flex items-center gap-4"
          style={{ background: 'var(--c-navy)', border: '1px solid var(--c-navy)', color: '#fff' }}
        >
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span className="text-sm font-semibold">
              {selected.size} nota{selected.size !== 1 ? 's' : ''} seleccionada{selected.size !== 1 ? 's' : ''}
            </span>
          </div>
          <span className="text-xs opacity-75">·</span>
          <span className="text-xs">{selectionCustomerName}</span>
          <span className="text-xs opacity-75">·</span>
          <span className="text-xs">
            Saldo combinado: <span className="font-mono font-bold">${selectionBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={clearSelection}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold hover:opacity-75 transition-opacity"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff' }}
            >
              Cancelar
            </button>
            <button
              onClick={() => setShowMulti(true)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold hover:opacity-85 transition-opacity"
              style={{ background: '#059669', color: '#fff' }}
            >
              Abonar a seleccionadas
            </button>
          </div>
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: 1400 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--c-rim)' }}>
                {canAbono && <th className="px-3 py-2.5 w-8" />}
                <Th>FECHA</Th>
                <Th>CLIENTE</Th>
                <Th>UNIDAD</Th>
                <Th>O.S.</Th>
                <Th>REMISIÓN</Th>
                <Th right>TOTAL</Th>
                <Th right>SALDO</Th>
                <Th>STATUS</Th>
                <Th>OBSERVACIONES</Th>
                <Th>AGENTE</Th>
                <Th>APLICAR CRÉDITO</Th>
                <Th />
                <Th>1° ABONO</Th>
                <Th>2° ABONO</Th>
                <Th>3° ABONO</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={canAbono ? 17 : 16} className="text-center py-10 text-sm" style={{ color: 'var(--c-ghost)' }}>
                    Sin notas
                  </td>
                </tr>
              ) : filtered.map(n => {
                const ns     = STATE_MAP[n.state] ?? STATE_MAP.draft
                const saldo  = Number(n.amount_balance)
                const checked = selected.has(n.id)
                const selectable = isSelectable(n)
                const rowHighlight = checked ? { background: 'rgba(6, 150, 105, 0.06)' } : undefined
                return (
                  <tr key={n.id}
                    style={{ borderBottom: '1px solid var(--c-rim)', cursor: 'pointer', ...rowHighlight }}
                    className="hover:opacity-80 transition-opacity"
                    onClick={() => router.push(`/ventas/${n.sale_id}`)}>

                    {canAbono && (
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!selectable && !checked}
                          onChange={() => toggleSelect(n.id)}
                          className="accent-emerald-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
                          title={
                            !selectable && !checked
                              ? (selectionCustomerId && n.customer_id !== selectionCustomerId
                                  ? 'Solo notas del mismo cliente'
                                  : saldo <= 0 ? 'Sin saldo pendiente' : 'No disponible')
                              : 'Seleccionar para abonar'
                          }
                        />
                      </td>
                    )}
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                      {fmtDate(n.fecha)}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium" style={{ color: 'var(--c-ink)', maxWidth: 180 }}>
                      <span className="block truncate" title={n.cliente}>{n.cliente}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--c-ink)' }}>
                      {n.unit_name || <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <Link href={`/ventas/${n.sale_id}`}
                        className="font-mono text-xs font-medium hover:underline"
                        style={{ color: 'var(--c-navy)' }}>
                        {n.orden_servicio}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs font-medium" style={{ color: 'var(--c-ink)' }}>
                      {n.remision}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs" style={{ color: 'var(--c-ink)' }}>
                      ${fmtMXN(n.amount_total)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="block font-mono text-xs font-semibold"
                        style={{ color: saldo <= 0 ? '#15803D' : '#B45309' }}>
                        ${fmtMXN(n.amount_balance)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: ns.bg, color: ns.text }}>
                        {ns.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--c-dim)', maxWidth: 160 }}>
                      {n.observaciones
                        ? <span className="block truncate" title={n.observaciones}>{n.observaciones}</span>
                        : <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--c-dim)' }}>
                      {n.agente || <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      {canAbono && n.state !== 'cancelled' && n.state !== 'draft' && Number(n.amount_balance) > 0.005 &&
                        Number(n.credit_disponible) > 0.005 && (
                        <button
                          type="button"
                          onClick={() => setCreditClienteNote(n)}
                          className="text-xs font-semibold px-1.5 py-1 rounded-lg transition-all hover:scale-105 hover:shadow-md cursor-pointer"
                          style={{ background: '#DCFCE7', color: '#15803D' }}
                          title="Descontar crédito del cliente">
                          💰 ${fmtMXN(n.credit_disponible)}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      {canAbono && n.state !== 'cancelled' && n.state !== 'draft' && (
                        <button onClick={() => setAbonoNote(n)}
                          className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all hover:scale-105 hover:shadow-md cursor-pointer"
                          style={{ background: '#059669', color: '#fff' }}>
                          + Abono
                        </button>
                      )}
                    </td>
                    <AbonoCell fecha={n.abono1_fecha} monto={n.abono1_monto} />
                    <AbonoCell fecha={n.abono2_fecha} monto={n.abono2_monto} />
                    <AbonoCell fecha={n.abono3_fecha} monto={n.abono3_monto} />
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals bar */}
        <div className="flex items-center justify-end gap-8 px-4 py-3"
          style={{ borderTop: '2px solid var(--c-rim)' }}>
          <TotalChip label="Total general" value={totals.total} color="var(--c-ink)" />
          <TotalChip label="Total cobrado" value={totals.paid} color="#15803D" />
          <TotalChip label="Pendiente" value={totals.balance} color={totals.balance > 0.005 ? '#B45309' : '#15803D'} bold />
        </div>
      </div>

      {abonoNote && (
        <AbonoModal
          noteId={abonoNote.id}
          remision={abonoNote.remision}
          balance={abonoNote.amount_balance}
          onClose={() => setAbonoNote(null)}
          onCreated={() => { setAbonoNote(null); toast('Abono registrado'); router.refresh() }}
        />
      )}

      {editNote && (
        <EditFieldsModal
          saleId={editNote.sale_id}
          noteId={editNote.id}
          remision={editNote.remision}
          initialObservaciones={editNote.observaciones}
          onClose={() => setEditNote(null)}
          onSaved={() => { setEditNote(null); toast('Datos actualizados'); router.refresh() }}
        />
      )}

      {showNewNote && (
        <NewNoteSaleSelector
          sales={activeSales}
          onClose={() => setShowNewNote(false)}
        />
      )}

      {creditNote && (
        <AplicarCreditoModal
          customerId={creditNote.customer_id}
          noteId={creditNote.id}
          remision={creditNote.remision}
          noteBalance={creditNote.amount_balance}
          creditDisponible={creditNote.credit_disponible}
          onClose={() => setCreditNote(null)}
          onApplied={() => { setCreditNote(null); toast('Crédito aplicado'); router.refresh() }}
        />
      )}

      {creditClienteNote && (
        <AplicarCreditoClienteModal
          customerId={creditClienteNote.customer_id}
          customerName={creditClienteNote.cliente}
          creditDisponible={creditClienteNote.credit_disponible}
          onClose={() => setCreditClienteNote(null)}
          onApplied={() => { setCreditClienteNote(null); toast('Crédito aplicado a notas'); router.refresh() }}
        />
      )}

      {showMulti && selectionCustomerId && (
        <MultiAbonoModal
          customerId={selectionCustomerId}
          customerName={selectionCustomerName}
          notes={selectedNotes.map(n => ({
            id: n.id,
            remision: n.remision,
            amount_balance: n.amount_balance,
          }))}
          onClose={() => setShowMulti(false)}
          onCreated={() => {
            setShowMulti(false)
            clearSelection()
            toast('Abono múltiple registrado')
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--c-rim)',
  border: '1px solid var(--c-rim)',
  color: 'var(--c-ink)',
  outline: 'none',
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: 'var(--c-ghost)' }}>{label}</label>
      {children}
    </div>
  )
}

function SelectFilter({ value, onChange, placeholder, options, labels }:
  { value: string; onChange: (v: string) => void; placeholder: string; options: string[]; labels?: Record<string, string> }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="rounded-lg px-2.5 py-1.5 text-xs w-36" style={inputStyle}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
    </select>
  )
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-3 py-2.5 whitespace-nowrap text-xs font-semibold ${right ? 'text-right' : 'text-left'}`}
      style={{ color: 'var(--c-ghost)' }}>
      {children}
    </th>
  )
}

function AbonoCell({ fecha, monto }: { fecha: string | null; monto: string | null }) {
  if (!monto) return <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--c-ghost)' }}>—</td>
  return (
    <td className="px-3 py-2.5 whitespace-nowrap">
      <span className="block text-xs font-mono font-semibold" style={{ color: '#15803D' }}>
        ${fmtMXN(monto)}
      </span>
      <span className="block text-xs" style={{ color: 'var(--c-ghost)' }}>{fmtDate(fecha)}</span>
    </td>
  )
}

function TotalChip({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className="text-right">
      <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>{label}</p>
      <p className={`font-mono text-sm ${bold ? 'font-bold' : 'font-semibold'}`} style={{ color }}>
        ${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
      </p>
    </div>
  )
}
