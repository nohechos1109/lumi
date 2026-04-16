'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { CobranzaNote } from '@/lib/queries/sale-notes'
import { toast } from '@/lib/toast'
import FilterSelect from '@/components/ui/FilterSelect'
import AbonoModal from './AbonoModal'
import EditFieldsModal from './EditFieldsModal'
import NewNoteSaleSelector from './NewNoteSaleSelector'
import MultiAbonoModal from './MultiAbonoModal'
import AplicarCreditoModal from './AplicarCreditoModal'
import AplicarCreditoClienteModal from './AplicarCreditoClienteModal'
import { fmtMXN, fmtDate } from '@/lib/formatters'
import DateRangePicker from './DateRangePicker'

// ── Column definitions ────────────────────────────────────────────────────────

type ColKey = 'fecha' | 'cliente' | 'unidad' | 'os' | 'remision' | 'total' | 'saldo' | 'status' | 'observaciones' | 'agente' | 'credito' | 'abono_btn' | 'abonos'

const COLUMNS: { key: ColKey; label: string }[] = [
  { key: 'fecha',         label: 'Fecha' },
  { key: 'cliente',       label: 'Cliente' },
  { key: 'unidad',        label: 'Unidad' },
  { key: 'os',            label: 'O.S.' },
  { key: 'remision',      label: 'Remisión' },
  { key: 'total',         label: 'Total' },
  { key: 'saldo',         label: 'Saldo' },
  { key: 'status',        label: 'Status' },
  { key: 'observaciones', label: 'Observaciones' },
  { key: 'agente',        label: 'Agente' },
  { key: 'credito',       label: 'Aplicar Crédito' },
  { key: 'abono_btn',     label: '+ Abono (botón)' },
  { key: 'abonos',        label: 'Abonos' },
]

const DEFAULT_VISIBILITY: Record<ColKey, boolean> = {
  fecha: true, cliente: true, unidad: true, os: true, remision: true,
  total: true, saldo: true, status: true, observaciones: true, agente: true,
  credito: true, abono_btn: true, abonos: true,
}

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
  unidad: string
  observaciones: string
}

const EMPTY: Filters = {
  search: '', dateFrom: '', dateTo: '', cliente: '', estado: '', agente: '', unidad: '', observaciones: '',
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
  const [showColModal, setShowColModal]   = useState(false)
  const [colVisibility, setColVisibility] = useState<Record<ColKey, boolean>>(DEFAULT_VISIBILITY)
  const [showMoreFilters, setShowMoreFilters] = useState(false)
  const canCreateNote = role === 'manager' || role === 'admin' || role === 'sales'

  const col = useCallback((key: ColKey) => colVisibility[key], [colVisibility])
  const toggleCol = useCallback((key: ColKey) =>
    setColVisibility(prev => ({ ...prev, [key]: !prev[key] })), [])

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
    if (filters.unidad   && !(n.unit_name ?? '').toLowerCase().includes(filters.unidad.toLowerCase())) return false
    if (filters.observaciones && !(n.observaciones ?? '').toLowerCase().includes(filters.observaciones.toLowerCase())) return false
    return true
  }), [notes, filters])

  const totals = useMemo(() => ({
    total:   filtered.reduce((s, n) => s + Number(n.amount_total),   0),
    paid:    filtered.reduce((s, n) => s + Number(n.amount_paid),    0),
    balance: filtered.reduce((s, n) => s + Number(n.amount_balance), 0),
  }), [filtered])

  const maxAbonos = useMemo(
    () => Math.max(0, ...filtered.map(n => n.abonos?.length ?? 0)),
    [filtered]
  )

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY)
  const secondaryActiveCount = (filters.unidad ? 1 : 0) + (filters.observaciones ? 1 : 0)
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
      <div className="flex flex-col gap-4 mb-6">

        {/* Search bar */}
        <div style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
          <div
            className="flex items-center h-12 rounded-full transition-shadow"
            style={{
              background: 'var(--c-card)',
              border: filters.search ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
              boxShadow: filters.search
                ? '0 2px 8px rgba(37,99,235,0.10), 0 0 0 3px rgba(37,99,235,0.06)'
                : '0 1px 4px rgba(15,23,42,0.06)',
            }}
          >
            <div className="flex items-center justify-center w-12 shrink-0" style={{ color: filters.search ? 'var(--c-navy)' : 'var(--c-ghost)', opacity: filters.search ? 0.85 : 0.5 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por remisión u orden de servicio..."
              className="flex-1 h-full bg-transparent outline-none text-sm font-medium"
              value={filters.search}
              onChange={e => setF('search', e.target.value)}
              style={{ color: 'var(--c-ink)' }}
            />
            {filters.search && (
              <button
                onClick={() => setF('search', '')}
                className="flex items-center justify-center w-10 h-10 mr-1 rounded-full transition-colors"
                style={{ color: 'var(--c-dim)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--c-rim)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter pills row + actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* filter icon */}
            <div className="flex items-center gap-1" style={{ color: 'var(--c-ghost)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="10" y1="18" x2="14" y2="18"/>
              </svg>
            </div>

            <DateRangePicker
              dateFrom={filters.dateFrom}
              dateTo={filters.dateTo}
              onChange={(from, to) => { setF('dateFrom', from); setF('dateTo', to) }}
            />

            {/* Cliente pill input */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Cliente"
                value={filters.cliente}
                onChange={e => setF('cliente', e.target.value)}
                className="h-8 pl-3.5 text-xs font-semibold outline-none transition-all"
                style={{
                  borderRadius: '999px',
                  paddingRight: filters.cliente ? '28px' : '14px',
                  width: filters.cliente ? 160 : 90,
                  background: filters.cliente ? 'var(--c-navy-bg)' : 'var(--c-card)',
                  border: filters.cliente ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
                  color: filters.cliente ? 'var(--c-navy)' : 'var(--c-dim)',
                  boxShadow: filters.cliente ? 'none' : '0 1px 3px rgba(15,23,42,0.04)',
                }}
              />
              {filters.cliente && (
                <button
                  onClick={() => setF('cliente', '')}
                  className="absolute right-1.5 flex items-center justify-center w-4 h-4 rounded-full cursor-pointer"
                  style={{ background: 'var(--c-navy-bd)', color: 'var(--c-navy)' }}
                >
                  <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                    <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
                  </svg>
                </button>
              )}
            </div>

            <FilterSelect
              value={filters.estado}
              onChange={v => setF('estado', v)}
              placeholder="Estado"
              options={[
                { value: 'draft',     label: 'Borrador' },
                { value: 'confirmed', label: 'Confirmada' },
                { value: 'paid',      label: 'Pagada' },
                { value: 'cancelled', label: 'Cancelada' },
              ]}
            />

            {uniqueAgentes.length > 0 && (
              <FilterSelect
                value={filters.agente}
                onChange={v => setF('agente', v)}
                placeholder="Agente"
                options={uniqueAgentes.map(a => ({ value: a, label: a }))}
              />
            )}

            {/* Más filtros */}
            <button
              onClick={() => setShowMoreFilters(v => !v)}
              className="flex items-center gap-1.5 h-8 pl-3.5 pr-2.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: (showMoreFilters || secondaryActiveCount > 0) ? 'var(--c-navy-bg)' : 'var(--c-card)',
                color: (showMoreFilters || secondaryActiveCount > 0) ? 'var(--c-navy)' : 'var(--c-dim)',
                border: (showMoreFilters || secondaryActiveCount > 0) ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
                boxShadow: (showMoreFilters || secondaryActiveCount > 0) ? 'none' : '0 1px 3px rgba(15,23,42,0.04)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Más filtros
              {secondaryActiveCount > 0 && (
                <span className="flex items-center justify-center rounded-full font-bold text-white"
                  style={{ background: 'var(--c-navy)', width: 16, height: 16, fontSize: 9 }}>
                  {secondaryActiveCount}
                </span>
              )}
            </button>

            {hasFilters && (
              <button
                onClick={() => { setFilters(EMPTY); setShowMoreFilters(false) }}
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold transition-all hover:opacity-80"
                style={{ background: 'var(--c-rose-bg)', color: 'var(--c-rose)', border: '1px solid rgba(209,44,60,0.18)' }}
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
                </svg>
                Limpiar
              </button>
            )}

            <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--c-ghost)' }}>
              {filtered.length}<span style={{ color: 'var(--c-rim-hi)' }}>/</span>{notes.length}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowColModal(true)}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'var(--c-panel)', color: 'var(--c-dim)', border: '1px solid var(--c-rim)' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
              Columnas
            </button>
            {canCreateNote && (
              <button
                onClick={() => setShowNewNote(true)}
                className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl text-xs font-semibold transition-opacity hover:opacity-85"
                style={{ background: 'var(--c-navy)', color: '#fff' }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14"/>
                </svg>
                Nueva Nota
              </button>
            )}
          </div>
        </div>

        {/* Secondary filters */}
        {showMoreFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--c-rim)' }}>
            {/* Unidad pill input */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Unidad"
                value={filters.unidad}
                onChange={e => setF('unidad', e.target.value)}
                className="h-8 pl-3.5 text-xs font-semibold outline-none transition-all"
                style={{
                  borderRadius: '999px',
                  paddingRight: filters.unidad ? '28px' : '14px',
                  width: filters.unidad ? 140 : 90,
                  background: filters.unidad ? 'var(--c-navy-bg)' : 'var(--c-card)',
                  border: filters.unidad ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
                  color: filters.unidad ? 'var(--c-navy)' : 'var(--c-dim)',
                  boxShadow: filters.unidad ? 'none' : '0 1px 3px rgba(15,23,42,0.04)',
                }}
              />
              {filters.unidad && (
                <button onClick={() => setF('unidad', '')} className="absolute right-1.5 flex items-center justify-center w-4 h-4 rounded-full cursor-pointer" style={{ background: 'var(--c-navy-bd)', color: 'var(--c-navy)' }}>
                  <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
                </button>
              )}
            </div>
            {/* Observaciones pill input */}
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Observaciones"
                value={filters.observaciones}
                onChange={e => setF('observaciones', e.target.value)}
                className="h-8 pl-3.5 text-xs font-semibold outline-none transition-all"
                style={{
                  borderRadius: '999px',
                  paddingRight: filters.observaciones ? '28px' : '14px',
                  width: filters.observaciones ? 180 : 130,
                  background: filters.observaciones ? 'var(--c-navy-bg)' : 'var(--c-card)',
                  border: filters.observaciones ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
                  color: filters.observaciones ? 'var(--c-navy)' : 'var(--c-dim)',
                  boxShadow: filters.observaciones ? 'none' : '0 1px 3px rgba(15,23,42,0.04)',
                }}
              />
              {filters.observaciones && (
                <button onClick={() => setF('observaciones', '')} className="absolute right-1.5 flex items-center justify-center w-4 h-4 rounded-full cursor-pointer" style={{ background: 'var(--c-navy-bd)', color: 'var(--c-navy)' }}>
                  <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
                </button>
              )}
            </div>
          </div>
        )}
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
              <tr style={{ borderBottom: '1px solid var(--c-rim)', background: 'var(--c-base)' }}>
                {canAbono && <th className="px-3 py-2.5 w-8" />}
                {col('fecha')         && <Th>FECHA</Th>}
                {col('cliente')       && <Th>CLIENTE</Th>}
                {col('unidad')        && <Th>UNIDAD</Th>}
                {col('os')            && <Th>ORD. SERVICIO</Th>}
                {col('remision')      && <Th>REMISIÓN</Th>}
                {col('total')         && <Th right>TOTAL</Th>}
                {col('saldo')         && <Th right>SALDO</Th>}
                {col('status')        && <Th>STATUS</Th>}
                {col('observaciones') && <Th>OBSERVACIONES</Th>}
                {col('agente')        && <Th>AGENTE</Th>}
                {col('credito')   && <Th />}
                {col('abono_btn') && <Th />}
                {col('abonos') && Array.from({ length: maxAbonos }, (_, i) => (
                  <Th key={i}>{i + 1}° ABONO</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={99} className="py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full p-4" style={{ background: 'var(--c-base)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--c-ghost)' }}>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                        </svg>
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'var(--c-dim)' }}>
                        {hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay notas de cobranza'}
                      </p>
                      {hasFilters && (
                        <button onClick={() => setFilters(EMPTY)}
                          className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 hover:opacity-80"
                          style={{ background: 'var(--c-rim)', color: 'var(--c-dim)' }}>
                          Limpiar filtros
                        </button>
                      )}
                    </div>
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
                    className={`transition-colors duration-100${checked ? '' : ' cobranza-row'}`}
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
                    {col('fecha') && (
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                        {fmtDate(n.fecha)}
                      </td>
                    )}
                    {col('cliente') && (
                      <td className="px-3 py-2.5 text-xs font-medium" style={{ color: 'var(--c-ink)', maxWidth: 180 }}>
                        <span className="block truncate" title={n.cliente}>{n.cliente}</span>
                      </td>
                    )}
                    {col('unidad') && (
                      <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--c-ink)' }}>
                        {n.unit_name || <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                      </td>
                    )}
                    {col('os') && (
                      <td className="px-3 py-2.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <Link href={`/ventas/${n.sale_id}`}
                          className="font-mono text-xs font-medium hover:underline"
                          style={{ color: 'var(--c-navy)' }}>
                          {n.orden_servicio}
                        </Link>
                      </td>
                    )}
                    {col('remision') && (
                      <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs font-medium" style={{ color: 'var(--c-ink)' }}>
                        {n.remision}
                      </td>
                    )}
                    {col('total') && (
                      <td className="px-3 py-2.5 text-right font-mono text-xs" style={{ color: 'var(--c-ink)' }}>
                        ${fmtMXN(n.amount_total)}
                      </td>
                    )}
                    {col('saldo') && (
                      <td className="px-3 py-2.5 text-right">
                        <span className="block font-mono text-xs font-semibold"
                          style={{ color: saldo <= 0 ? '#15803D' : '#B45309' }}>
                          ${fmtMXN(n.amount_balance)}
                        </span>
                      </td>
                    )}
                    {col('status') && (
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: ns.bg, color: ns.text }}>
                          {ns.label}
                        </span>
                      </td>
                    )}
                    {col('observaciones') && (
                      <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--c-dim)', maxWidth: 160 }}>
                        {n.observaciones
                          ? <span className="block truncate" title={n.observaciones}>{n.observaciones}</span>
                          : <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                      </td>
                    )}
                    {col('agente') && (
                      <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--c-dim)' }}>
                        {n.agente || <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                      </td>
                    )}
                    {col('credito') && (
                      <td className="px-3 py-2.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {canAbono && n.state !== 'cancelled' && n.state !== 'draft' && Number(n.amount_balance) > 0.005 &&
                          Number(n.credit_disponible) > 0.005 && (
                          <button
                            type="button"
                            onClick={() => setCreditClienteNote(n)}
                            className="text-xs font-semibold px-1.5 py-1 rounded-lg transition-all hover:scale-105 hover:shadow-md cursor-pointer"
                            style={{ background: '#DCFCE7', color: '#15803D' }}
                            title="Descontar crédito del cliente">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#CA8A04" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1 -mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8"/><path d="M12 18V6"/></svg>${fmtMXN(n.credit_disponible)}
                          </button>
                        )}
                      </td>
                    )}
                    {col('abono_btn') && (
                      <td className="px-3 py-2.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        {canAbono && n.state !== 'cancelled' && n.state !== 'draft' && n.state !== 'paid' && (
                          <button onClick={() => setAbonoNote(n)}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all hover:scale-105 hover:shadow-md cursor-pointer"
                            style={{ background: '#059669', color: '#fff' }}>
                            + Abono
                          </button>
                        )}
                      </td>
                    )}
                    {col('abonos') && Array.from({ length: maxAbonos }, (_, i) => {
                      const ab = n.abonos?.[i]
                      return <AbonoCell key={i} fecha={ab?.fecha ?? null} monto={ab?.monto ?? null} />
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals bar */}
        <div className="flex items-center justify-end gap-2 px-4 py-3"
          style={{ borderTop: '1px solid var(--c-rim)', background: 'var(--c-base)' }}>
          {totals.total > 0 && (
            <div className="flex items-center gap-1 mr-2" style={{ flex: '0 0 180px' }}>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--c-rim)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (totals.paid / totals.total) * 100).toFixed(1)}%`, background: '#15803D' }} />
              </div>
              <span className="text-xs font-mono font-semibold ml-1" style={{ color: 'var(--c-ghost)', fontSize: 10 }}>
                {totals.total > 0 ? ((totals.paid / totals.total) * 100).toFixed(0) : 0}%
              </span>
            </div>
          )}
          <TotalChip label="Total general" value={totals.total} color="var(--c-dim)" />
          <div className="w-px h-6 mx-2" style={{ background: 'var(--c-rim)' }} />
          <TotalChip label="Cobrado" value={totals.paid} color="#15803D" />
          <div className="w-px h-6 mx-2" style={{ background: 'var(--c-rim)' }} />
          <div className="rounded-lg px-3 py-1.5"
            style={{ background: totals.balance > 0.005 ? 'rgba(196,127,8,0.09)' : 'rgba(21,128,61,0.08)', border: `1px solid ${totals.balance > 0.005 ? 'rgba(196,127,8,0.22)' : 'rgba(21,128,61,0.2)'}` }}>
            <TotalChip label="Pendiente" value={totals.balance} color={totals.balance > 0.005 ? 'var(--c-gold)' : '#15803D'} bold />
          </div>
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

      {showColModal && (
        <ColVisibilityModal
          columns={COLUMNS}
          visibility={colVisibility}
          onToggle={toggleCol}
          onClose={() => setShowColModal(false)}
          onReset={() => setColVisibility(DEFAULT_VISIBILITY)}
        />
      )}
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: 'var(--c-card)',
  border: '1px solid var(--c-rim)',
  color: 'var(--c-ink)',
  outline: 'none',
  boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
}

const inputActiveStyle: React.CSSProperties = {
  background: 'var(--c-card)',
  border: '1.5px solid var(--c-navy-bd)',
  color: 'var(--c-ink)',
  outline: 'none',
  boxShadow: '0 0 0 2px rgba(37,99,235,0.08)',
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold" style={{ color: 'var(--c-ghost)' }}>{label}</label>
      {children}
    </div>
  )
}

function SelectFilter({ value, onChange, placeholder, options, labels, active }:
  { value: string; onChange: (v: string) => void; placeholder: string; options: string[]; labels?: Record<string, string>; active?: boolean }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className="rounded-lg px-2.5 py-1.5 text-xs w-36 transition-all duration-150"
      style={active ? inputActiveStyle : inputStyle}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
    </select>
  )
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-3 py-2.5 whitespace-nowrap text-xs font-semibold tracking-wide ${right ? 'text-right' : 'text-left'}`}
      style={{ color: 'var(--c-dim)', letterSpacing: '0.04em' }}>
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

function ColVisibilityModal({ columns, visibility, onToggle, onClose, onReset }: {
  columns: { key: ColKey; label: string }[]
  visibility: Record<ColKey, boolean>
  onToggle: (key: ColKey) => void
  onClose: () => void
  onReset: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={onClose}>
      <div className="rounded-2xl p-5 w-72 shadow-2xl"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: 'var(--c-ink)' }}>Columnas visibles</h3>
          <button onClick={onClose}
            className="rounded-lg p-1 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--c-ghost)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Toggles */}
        <ul className="flex flex-col gap-2.5">
          {columns.map(({ key, label }) => (
            <li key={key} className="flex items-center justify-between">
              <span className="text-xs font-medium" style={{ color: 'var(--c-ink)' }}>{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={visibility[key]}
                onClick={() => onToggle(key)}
                className="relative inline-flex items-center rounded-full transition-colors duration-200 focus:outline-none"
                style={{
                  width: 36, height: 20,
                  background: visibility[key] ? '#059669' : 'var(--c-rim)',
                  border: '1px solid ' + (visibility[key] ? '#059669' : 'var(--c-ghost)'),
                }}>
                <span
                  className="inline-block rounded-full bg-white shadow transition-transform duration-200"
                  style={{
                    width: 14, height: 14,
                    transform: visibility[key] ? 'translateX(18px)' : 'translateX(2px)',
                  }}
                />
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: '1px solid var(--c-rim)' }}>
          <button onClick={onReset}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-75 transition-opacity"
            style={{ background: 'var(--c-rim)', color: 'var(--c-dim)' }}>
            Restaurar todo
          </button>
        </div>
      </div>
    </div>
  )
}
