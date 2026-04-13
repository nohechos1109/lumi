'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { CustomerPayment } from '@/lib/queries/customer-payments'
import type { Customer } from '@/lib/queries/customers'
import { toast } from '@/lib/toast'
import RegistrarPagoModal from './RegistrarPagoModal'
import EditarPagoModal from './EditarPagoModal'
import PagoDetailModal from './PagoDetailModal'
import CancelarPagoModal from './CancelarPagoModal'
import AplicarPagoANotasModal from './AplicarPagoANotasModal'

import { fmtMXN, fmtDate } from '@/lib/formatters'
import { METHOD_LABELS, PAYMENT_STATE_BADGE } from '@/lib/constants/payments'

// ── Interfaces ────────────────────────────────────────────────────────────────

interface Props {
  payments: CustomerPayment[]
  customers: Customer[]
  role: string
}

interface Filters {
  search: string
  dateFrom: string
  dateTo: string
  method: string
  estado: string
}

const EMPTY: Filters = { search: '', dateFrom: '', dateTo: '', method: '', estado: '' }

// ── Main Component ────────────────────────────────────────────────────────────

export default function PagosTable({ payments, customers, role }: Props) {
  const router = useRouter()
  const [filters, setFilters] = useState<Filters>(EMPTY)
  const [showRegister, setShowRegister] = useState(false)
  const [detailPayment, setDetailPayment]   = useState<CustomerPayment | null>(null)
  const [editPayment,   setEditPayment]     = useState<CustomerPayment | null>(null)
  const [cancelPayment, setCancelPayment]   = useState<CustomerPayment | null>(null)
  const [applyPayment,  setApplyPayment]    = useState<CustomerPayment | null>(null)
  const [confirmingId,  setConfirmingId]    = useState<string | null>(null)

  const canManage = role === 'manager' || role === 'admin'

  const handleConfirm = useCallback(async (paymentId: string) => {
    setConfirmingId(paymentId)
    try {
      const res = await fetch(`/api/pagos/${paymentId}/confirm`, { method: 'POST' })
      if (res.ok) {
        toast('Pago confirmado')
        router.refresh()
      } else {
        const d = await res.json()
        toast(d.error ?? 'Error al confirmar')
      }
    } finally {
      setConfirmingId(null)
    }
  }, [router])

  const setF = useCallback(<K extends keyof Filters>(key: K, val: string) =>
    setFilters(prev => ({ ...prev, [key]: val })), [])

  const filtered = useMemo(() => payments.filter(p => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const matchNum = p.number.toLowerCase().includes(q)
      const matchClient = (p.customer_name ?? '').toLowerCase().includes(q)
      if (!matchNum && !matchClient) return false
    }
    if (filters.dateFrom && p.payment_date.slice(0, 10) < filters.dateFrom) return false
    if (filters.dateTo   && p.payment_date.slice(0, 10) > filters.dateTo)   return false
    if (filters.method   && p.payment_method !== filters.method)             return false
    if (filters.estado   && p.state !== filters.estado)                      return false
    return true
  }), [payments, filters])

  const totals = useMemo(() => {
    let received = 0, available = 0
    for (const p of filtered) {
      if (p.state === 'confirmed') {
        received  += Number(p.amount)
        available += Number(p.amount_available ?? 0)
      }
    }
    return { received, available }
  }, [filtered])

  const hasFilters = !!(filters.search || filters.dateFrom || filters.dateTo || filters.method || filters.estado)

  return (
    <div>
      {/* Filter bar */}
      <div className="rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end"
        style={{ background: 'var(--c-card)', border: '1px solid var(--c-rim)' }}>

        <FilterField label="Búsqueda">
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2" width="12" height="12"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color: 'var(--c-ghost)' }}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="text" placeholder="Número / cliente..." value={filters.search}
              onChange={e => setF('search', e.target.value)}
              className="rounded-lg pl-8 pr-3 py-1.5 text-xs w-44" style={inputStyle} />
          </div>
        </FilterField>

        <FilterField label="Fecha">
          <div className="flex items-center gap-1.5">
            <input type="date" value={filters.dateFrom} onChange={e => setF('dateFrom', e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-xs w-36" style={inputStyle} />
            <span className="text-xs" style={{ color: 'var(--c-ghost)' }}>—</span>
            <input type="date" value={filters.dateTo} onChange={e => setF('dateTo', e.target.value)}
              className="rounded-lg px-2.5 py-1.5 text-xs w-36" style={inputStyle} />
          </div>
        </FilterField>

        <FilterField label="Método">
          <select value={filters.method} onChange={e => setF('method', e.target.value)}
            className="rounded-lg px-2.5 py-1.5 text-xs w-36" style={inputStyle}>
            <option value="">Todos</option>
            {Object.entries(METHOD_LABELS).map(([v, l]) =>
              <option key={v} value={v}>{l}</option>
            )}
          </select>
        </FilterField>

        <FilterField label="Estado">
          <select value={filters.estado} onChange={e => setF('estado', e.target.value)}
            className="rounded-lg px-2.5 py-1.5 text-xs w-36" style={inputStyle}>
            <option value="">Todos</option>
            <option value="draft">Borrador</option>
            <option value="confirmed">Confirmado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </FilterField>

        <div className="flex items-end gap-3 ml-auto">
          <span className="text-xs pb-1.5" style={{ color: 'var(--c-ghost)' }}>
            {filtered.length} / {payments.length}
          </span>
          {hasFilters && (
            <button onClick={() => setFilters(EMPTY)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-75 transition-opacity"
              style={{ background: '#FFE4E6', color: '#BE123C' }}>
              Limpiar
            </button>
          )}
          {canManage && (
            <button onClick={() => setShowRegister(true)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-85 transition-opacity"
              style={{ background: 'var(--c-navy)', color: '#fff' }}>
              + Registrar Pago
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ borderCollapse: 'collapse', minWidth: 900 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--c-rim)' }}>
                <Th>FECHA</Th>
                <Th>NÚMERO</Th>
                <Th>CLIENTE</Th>
                <Th>MÉTODO</Th>
                <Th>CONCEPTO</Th>
                <Th right>MONTO</Th>
                <Th right>DISPONIBLE</Th>
                <Th>ESTADO</Th>
                <Th>REGISTRADO POR</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-sm" style={{ color: 'var(--c-ghost)' }}>
                    Sin pagos registrados
                  </td>
                </tr>
              ) : filtered.map(p => {
                const isCancelled = p.state === 'cancelled'
                const isDraft = p.state === 'draft'
                const available = Number(p.amount_available ?? 0)
                const stateBadge = PAYMENT_STATE_BADGE[p.state] ?? PAYMENT_STATE_BADGE.confirmed
                return (
                  <tr key={p.id}
                    style={{ borderBottom: '1px solid var(--c-rim)', opacity: isCancelled ? 0.55 : 1 }}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => setDetailPayment(p)}>

                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs" style={{ color: 'var(--c-dim)' }}>
                      {fmtDate(p.payment_date)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs font-medium" style={{ color: 'var(--c-ink)' }}>
                      {p.number}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-medium" style={{ color: 'var(--c-ink)', maxWidth: 200 }}>
                      <span className="block truncate" title={p.customer_name}>{p.customer_name}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--c-dim)' }}>
                      {METHOD_LABELS[p.payment_method] ?? p.payment_method}
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--c-dim)', maxWidth: 180 }}>
                      {p.concept
                        ? <span className="block truncate" title={p.concept}>{p.concept}</span>
                        : <span style={{ color: 'var(--c-ghost)' }}>—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold" style={{ color: 'var(--c-ink)' }}>
                      ${fmtMXN(p.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="font-mono text-xs font-semibold"
                        style={{ color: isDraft ? 'var(--c-ghost)' : available > 0.005 ? '#D97706' : '#15803D' }}>
                        {isDraft ? '—' : `$${fmtMXN(p.amount_available)}`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: stateBadge.bg, color: stateBadge.color }}>
                        {stateBadge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: 'var(--c-dim)' }}>
                      {p.registered_by_name ?? '—'}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        {canManage && isDraft && (
                          <button
                            onClick={() => setEditPayment(p)}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-opacity hover:opacity-80"
                            style={{ background: '#DBEAFE', color: '#1D4ED8' }}
                            title="Editar borrador">
                            Editar
                          </button>
                        )}
                        {canManage && isDraft && (
                          <button
                            onClick={() => handleConfirm(p.id)}
                            disabled={confirmingId === p.id}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                            style={{ background: '#DCFCE7', color: '#15803D' }}
                            title="Confirmar pago">
                            {confirmingId === p.id ? '...' : 'Confirmar'}
                          </button>
                        )}
                        {canManage && p.state === 'confirmed' && available > 0.005 && (
                          <button
                            onClick={() => setApplyPayment(p)}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-opacity hover:opacity-80"
                            style={{ background: '#DCFCE7', color: '#15803D' }}
                            title="Aplicar crédito a notas">
                            Aplicar
                          </button>
                        )}
                        {canManage && !isCancelled && (
                          <button
                            onClick={() => setCancelPayment(p)}
                            className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-opacity hover:opacity-80"
                            style={{ background: '#FFE4E6', color: '#BE123C' }}
                            title="Cancelar pago">
                            Cancelar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals bar */}
        <div className="flex items-center justify-end gap-8 px-4 py-3"
          style={{ borderTop: '2px solid var(--c-rim)' }}>
          <TotalChip label="Total recibido" value={totals.received} color="var(--c-ink)" />
          <TotalChip label="Disponible" value={totals.available}
            color={totals.available > 0.005 ? '#D97706' : '#15803D'} bold />
        </div>
      </div>

      {showRegister && (
        <RegistrarPagoModal
          customers={customers}
          onClose={() => setShowRegister(false)}
          onCreated={() => {
            setShowRegister(false)
            toast('Pago registrado')
            router.refresh()
          }}
        />
      )}

      {editPayment && (
        <EditarPagoModal
          payment={editPayment}
          onClose={() => setEditPayment(null)}
          onUpdated={() => {
            setEditPayment(null)
            toast('Pago actualizado')
            router.refresh()
          }}
        />
      )}

      {detailPayment && (
        <PagoDetailModal
          payment={detailPayment}
          onClose={() => setDetailPayment(null)}
        />
      )}

      {cancelPayment && (
        <CancelarPagoModal
          payment={cancelPayment}
          onClose={() => setCancelPayment(null)}
          onCancelled={() => {
            setCancelPayment(null)
            toast('Pago cancelado')
            router.refresh()
          }}
        />
      )}

      {applyPayment && (
        <AplicarPagoANotasModal
          payment={applyPayment}
          onClose={() => setApplyPayment(null)}
          onApplied={() => {
            setApplyPayment(null)
            toast('Crédito aplicado a notas')
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

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-3 py-2.5 whitespace-nowrap text-xs font-semibold ${right ? 'text-right' : 'text-left'}`}
      style={{ color: 'var(--c-ghost)' }}>
      {children}
    </th>
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
