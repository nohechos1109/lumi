'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import ProductSearch from './ProductSearch'
import PromptModal from '@/components/ui/PromptModal'
import ConfirmModal from '@/components/ui/ConfirmModal'
import PlantillaModal from '@/components/ui/PlantillaModal'
import RefreshPricesModal, { type RefreshRow } from '@/components/ui/RefreshPricesModal'
import { toast, notifyRefresh } from '@/lib/toast'
import { canSetManualPrice } from '@/lib/permissions'
import { useSSE } from '@/hooks/useSSE'
import type { QuoteLineStaleness } from '@/lib/queries/quote_lines'

interface QuoteLine {
  id: string; display_type: string; name: string; qty: string | null
  discount_percent: string; unit_price_mxn_effective: string
  unit_price_mxn_suggested: string; unit_price_mxn_manual: string | null
  cost_base_snapshot: string; product_id: string | null
  subtotal: string; tax_amount: string; total: string
  margin_amount: string; tax_name?: string; sequence: number
  discount_approval_status?: string
  pending_discount_percent?: string | null
  pending_approval_id?: string | null
}

interface Props {
  quoteId: string
  unitCount: number
  role?: string
  isLocked?: boolean
  quoteState?: string
  isShowroom?: boolean
  showMargin?: boolean
  initialStaleness?: QuoteLineStaleness[]
}

const inputCls = 'text-right rounded-lg px-2 py-1.5 text-sm font-mono outline-none transition-colors'
const inputStyle = {
  background: 'var(--c-panel)',
  border: '1px solid var(--c-rim)',
  color: 'var(--c-ink)',
}

export default function LineEditor({ quoteId, unitCount, role, isLocked, quoteState, isShowroom, showMargin = true, initialStaleness = [] }: Props) {
  const router = useRouter()
  const [lines, setLines] = useState<QuoteLine[]>([])
  const [totals, setTotals] = useState({ untaxed: 0, tax: 0, total: 0, margin: 0, marginPct: 0 })
  const [busy, setBusy] = useState(false)         // Block A: add-operation loading
  const [saving, setSaving] = useState(false)     // Block A: field-update loading
  const [textPrompt, setTextPrompt] = useState<'section' | 'note' | null>(null)
  const [discountPrompt, setDiscountPrompt] = useState(false)
  const [plantillaPrompt, setPlantillaPrompt] = useState(false)
  const [deleteConfirmLine, setDeleteConfirmLine] = useState<QuoteLine | null>(null) // Block B
  const [clearConfirm, setClearConfirm] = useState(false)
  const [editingLine, setEditingLine] = useState<{ id: string; name: string } | null>(null)
  const [staleMap, setStaleMap] = useState<Map<string, QuoteLineStaleness>>(
    () => new Map(initialStaleness.map(s => [s.line_id, s]))
  )
  const [refreshModal, setRefreshModal] = useState<{
    title: string
    rows: RefreshRow[]
    mode: 'preserve_manual' | 'use_suggested'
    scope: 'single' | 'all'
    lineId?: string
  } | null>(null)
  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const staleCount = useMemo(
    () => [...staleMap.values()].filter(s => s.reason !== 'product_deleted').length,
    [staleMap]
  )

  // Block A: error handling in loadLines
  const loadLines = useCallback(async () => {
    try {
      const r = await fetch(`/api/quotes/${quoteId}/lines`)
      if (!r.ok) throw new Error()
      const data: QuoteLine[] = await r.json()
      setLines(data)

      const productLines = data.filter(l => l.display_type === 'product' || l.display_type === 'discount')
      const untaxed = productLines.reduce((s, l) => s + Number(l.subtotal), 0)
      const tax = productLines.reduce((s, l) => s + Number(l.tax_amount), 0)
      const margin = productLines.reduce((s, l) => s + Number(l.margin_amount), 0)
      setTotals({ untaxed, tax, total: untaxed + tax, margin, marginPct: untaxed > 0 ? (margin / untaxed) * 100 : 0 })
    } catch {
      toast('Error al cargar las líneas', 'error')
    }
  }, [quoteId, router])

  const loadStaleness = useCallback(async () => {
    if (isLocked) return
    try {
      const r = await fetch(`/api/quotes/${quoteId}/lines/staleness`)
      if (!r.ok) return
      const data: QuoteLineStaleness[] = await r.json()
      setStaleMap(new Map(data.map(s => [s.line_id, s])))
    } catch { /* ignore transient errors */ }
  }, [quoteId, isLocked])

  useEffect(() => { loadLines() }, [loadLines])

  useSSE({
    discount_decision: (data) => {
      const d = data as { quoteId: string }
      if (d.quoteId === quoteId) loadLines()
    },
    fx_changed: () => { loadStaleness() },
    product_changed: () => { loadStaleness() },
    quote_lines_refreshed: (data) => {
      const d = data as { quoteId: string }
      if (d.quoteId === quoteId) { loadLines(); loadStaleness() }
    },
  })

  function buildRefreshRow(line: QuoteLine, stale: QuoteLineStaleness | null): RefreshRow {
    return {
      line_id: line.id,
      name: line.name,
      has_manual: line.unit_price_mxn_manual !== null,
      old_effective: Number(line.unit_price_mxn_effective),
      old_suggested: Number(line.unit_price_mxn_suggested),
      stale,
    }
  }

  function openRefreshLineModal(lineId: string, mode: 'preserve_manual' | 'use_suggested') {
    const line = lines.find(l => l.id === lineId)
    if (!line) return
    const stale = staleMap.get(lineId) ?? null
    if (stale?.reason === 'product_deleted') return
    if (mode === 'preserve_manual' && !stale) return

    setRefreshModal({
      title: mode === 'use_suggested' ? 'Usar precio sugerido' : 'Actualizar precio',
      rows: [buildRefreshRow(line, stale)],
      mode,
      scope: 'single',
      lineId,
    })
  }

  function openRefreshAllModal() {
    const rows: RefreshRow[] = []
    for (const line of lines) {
      if (line.display_type !== 'product') continue
      const stale = staleMap.get(line.id)
      if (!stale || stale.reason === 'product_deleted') continue
      rows.push(buildRefreshRow(line, stale))
    }
    if (rows.length === 0) return
    setRefreshModal({
      title: 'Actualizar precios desactualizados',
      rows,
      mode: 'preserve_manual',
      scope: 'all',
    })
  }

  async function confirmRefresh() {
    if (!refreshModal) return
    setBusy(true)
    try {
      const body = refreshModal.scope === 'all'
        ? { all: true }
        : { line_ids: [refreshModal.lineId], mode: refreshModal.mode }
      const r = await fetch(`/api/quotes/${quoteId}/lines/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!r.ok) throw new Error()
      const { refreshed = 0, skipped = [] } = await r.json().catch(() => ({})) as { refreshed?: number; skipped?: Array<{ reason: string }> }
      notifyRefresh()
      await Promise.all([loadLines(), loadStaleness()])
      router.refresh()
      if (refreshModal.scope === 'all') {
        const skippedDeleted = skipped.filter(s => s.reason === 'product_deleted').length
        toast(
          `${refreshed} ${refreshed === 1 ? 'actualizada' : 'actualizadas'}` +
          (skippedDeleted ? ` · ${skippedDeleted} omitidas (producto no disponible)` : '')
        )
      } else {
        toast(refreshModal.mode === 'use_suggested' ? 'Precio sugerido aplicado' : 'Precio actualizado')
      }
      setRefreshModal(null)
    } catch {
      toast('Error al actualizar precios', 'error')
    } finally {
      setBusy(false)
    }
  }

  function buildTooltip(s: QuoteLineStaleness, hasManual: boolean): string {
    const nf = (n: number | null) => n == null ? '' : n.toLocaleString('es-MX', { minimumFractionDigits: 2 })
    let msg = ''
    if (s.reason === 'product') {
      msg = `Producto actualizado. Nuevo sugerido: $${nf(s.new_suggested)} MXN.`
    } else if (s.reason === 'fx') {
      msg = `Tipo de cambio: ${s.old_fx} → ${s.new_fx}. Nuevo sugerido: $${nf(s.new_suggested)} MXN.`
    } else if (s.reason === 'both') {
      msg = `Producto y tipo de cambio actualizados. Nuevo sugerido: $${nf(s.new_suggested)} MXN.`
    }
    if (hasManual) msg += ' El precio manual se conservará al actualizar.'
    return msg
  }

  // Block A: busy state + error handling on add operations
  async function addProductLine(product: { id: string; name: string; description?: string | null }) {
    setBusy(true)
    try {
      const finalName = product.description ? `${product.name} - ${product.description}` : product.name

      const r = await fetch(`/api/quotes/${quoteId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_type: 'product', product_id: product.id, name: finalName, qty: 1,
        }),
      })
      if (!r.ok) throw new Error()
      notifyRefresh()
      await Promise.all([loadLines(), loadStaleness()])
      router.refresh()
    } catch {
      toast('Error al agregar el producto', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function addTextLine(type: 'section' | 'note', name: string) {
    setBusy(true)
    try {
      const r = await fetch(`/api/quotes/${quoteId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_type: type, name, qty: null }),
      })
      if (!r.ok) throw new Error()
      notifyRefresh()
      await Promise.all([loadLines(), loadStaleness()])
      router.refresh()
    } catch {
      toast('Error al agregar la línea', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function addDiscountLine(value: string) {
    const discount = parseFloat(value)
    if (isNaN(discount) || discount < 0 || discount > 100) return
    setBusy(true)
    try {
      const r = await fetch(`/api/quotes/${quoteId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_type: 'discount', name: 'Descuento Global', qty: null, discount_percent: discount }),
      })
      if (!r.ok) {
        const body = await r.json().catch(() => ({}))
        toast(body.error ?? 'Error al agregar el descuento', 'error')
        return
      }
      notifyRefresh()
      await loadLines()
      router.refresh()
    } catch {
      toast('Error al agregar el descuento', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function saveLineName(lineId: string, name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    setEditingLine(null)
    setLines(prev => prev.map(l => l.id === lineId ? { ...l, name: trimmed } : l))
    try {
      await fetch(`/api/quotes/${quoteId}/lines/${lineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
    } catch {
      toast('Error al guardar', 'error')
      await loadLines()
    }
  }

  async function applyPlantilla(items: { product_id: string; name: string; description: string | null; qty: number; discount_percent: number }[]) {
    const payload = items.map(item => ({
      product_id: item.product_id,
      name: item.description ? `${item.name} - ${item.description}` : item.name,
      qty: item.qty,
      discount_percent: item.discount_percent,
    }))

    setBusy(true)
    setPlantillaPrompt(false)
    try {
      const r = await fetch(`/api/quotes/${quoteId}/lines/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) throw new Error()
      notifyRefresh()
      await Promise.all([loadLines(), loadStaleness()])
      router.refresh()
    } catch {
      toast('Error al aplicar la plantilla', 'error')
    } finally {
      setBusy(false)
    }
  }

  async function cancelDiscountRequest(approvalId: string) {
    setSaving(true)
    try {
      const r = await fetch(`/api/discount-approvals/${approvalId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      await loadLines()
    } catch {
      toast('Error al cancelar la solicitud', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Block A: error handling on field updates
  async function updateField(lineId: string, field: string, value: number | string | null) {
    setSaving(true)
    try {
      const r = await fetch(`/api/quotes/${quoteId}/lines/${lineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!r.ok) throw new Error()
      notifyRefresh()
      await Promise.all([loadLines(), loadStaleness()])
      router.refresh()
    } catch {
      toast('Error al actualizar el campo', 'error')
    } finally {
      setSaving(false)
    }
  }

  // Block B: actual delete (called after confirmation)
  async function deleteLine(lineId: string) {
    try {
      const r = await fetch(`/api/quotes/${quoteId}/lines/${lineId}`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      notifyRefresh()
      await Promise.all([loadLines(), loadStaleness()])
      router.refresh()
    } catch {
      toast('Error al eliminar la línea', 'error')
    }
  }

  async function clearLines() {
    setBusy(true)
    try {
      const r = await fetch(`/api/quotes/${quoteId}/lines`, { method: 'DELETE' })
      if (!r.ok) throw new Error()
      notifyRefresh()
      await Promise.all([loadLines(), loadStaleness()])
      router.refresh()
      toast('Cotización limpiada exitosamente')
    } catch {
      toast('Error al limpiar la cotización', 'error')
    } finally {
      setBusy(false)
    }
  }

  function handleDragStart(index: number) { dragItem.current = index }
  function handleDragEnter(index: number) { dragOverItem.current = index }

  async function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return
    const reordered = [...lines]
    const [dragged] = reordered.splice(dragItem.current, 1)
    reordered.splice(dragOverItem.current, 0, dragged)
    dragItem.current = null
    dragOverItem.current = null
    setLines(reordered)

    try {
      await fetch(`/api/quotes/${quoteId}/lines/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: reordered.map((l, i) => ({ id: l.id, sequence: (i + 1) * 10 })) }),
      })
      await loadLines()
    } catch {
      toast('Error al reordenar las líneas', 'error')
    }
  }

  return (
    <div>
      {/* Search + add controls */}
      {!isLocked && (
        <div className={`mb-3 transition-opacity ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
          <ProductSearch onSelect={addProductLine} />
        </div>
      )}

      {/* Block A: action buttons + saving indicator */}
      {!isLocked && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Block D: replaced onMouseEnter/Leave with CSS classes */}
          <button
            onClick={() => setTextPrompt('section')}
            type="button"
            disabled={busy}
            className="btn-dashed inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Sección
          </button>
          <button
            onClick={() => setTextPrompt('note')}
            type="button"
            disabled={busy}
            className="btn-dashed inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Nota
          </button>
          <button
            onClick={() => setDiscountPrompt(true)}
            type="button"
            disabled={busy}
            className="btn-dashed-amber inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Descuento Global
          </button>
          {quoteState === 'draft' && (
            <button
              onClick={() => setClearConfirm(true)}
              type="button"
              disabled={busy}
              className="btn-dashed-rose inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed disabled:opacity-40"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6"/>
                <path d="M14 11v6"/>
                <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
              </svg>
              Limpiar
            </button>
          )}
          <button
            onClick={() => setPlantillaPrompt(true)}
            type="button"
            disabled={busy}
            className="btn-dashed inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed disabled:opacity-40 ml-auto"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Plantillas
          </button>

          {/* Block A: saving indicator */}
          {(busy || saving) && (
            <span className="text-xs ml-1" style={{ color: 'var(--c-ghost)' }}>
              Guardando...
            </span>
          )}
        </div>
      )}

      {/* Stale prices banner */}
      {!isLocked && staleCount > 0 && (
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-2.5 mb-3"
          style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.35)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="text-sm font-medium" style={{ color: '#B45309' }}>
            {staleCount === 1 ? '1 precio desactualizado' : `${staleCount} precios desactualizados`}
          </span>
          <button
            onClick={openRefreshAllModal}
            type="button"
            disabled={busy}
            className="ml-auto text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: '#B45309', color: 'white' }}
          >
            Actualizar todas
          </button>
        </div>
      )}

      {/* Block C: empty state */}
      {lines.length === 0 ? (
        <div
          className="rounded-2xl py-16 text-center"
          style={{ border: '1.5px dashed var(--c-rim)', background: 'var(--c-card)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--c-dim)' }}>Sin líneas</p>
          <p className="text-xs mt-1" style={{ color: 'var(--c-ghost)' }}>
            Busca un producto o usa los botones para agregar secciones y notas.
          </p>
        </div>
      ) : (
        /* Lines table */
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--c-rim)', background: 'var(--c-card)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--c-rim)' }}>
                  <th className="w-8 px-2 py-3.5"></th>
                  <th className="text-left px-4 py-3.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--c-ghost)' }}>Descripción</th>
                  <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-20" style={{ color: 'var(--c-ghost)' }}>Cant.</th>
                  <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-28" style={{ color: 'var(--c-ghost)' }}>Precio Unit.</th>
                  <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-20" style={{ color: 'var(--c-ghost)' }}>Desc %</th>
                  <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-28" style={{ color: 'var(--c-ghost)' }}>Subtotal</th>
                  {role === 'admin' && showMargin && (
                    <th className="text-right px-4 py-3.5 text-xs font-bold uppercase tracking-widest w-24" style={{ color: 'var(--c-ghost)' }}>Margen</th>
                  )}
                  {!isLocked && <th className="w-10 px-2 py-3.5"></th>}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const rowStyle = { borderTop: '1px solid var(--c-rim)' }

                  if (line.display_type === 'section') {
                    return (
                      <tr key={line.id} draggable={!isLocked} onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
                        className={isLocked ? '' : 'cursor-grab active:cursor-grabbing'} style={{ ...rowStyle, background: 'var(--c-panel)' }}>
                        <td className="px-2 py-2.5 text-center text-xs" style={{ color: 'var(--c-ghost)' }}>
                          {!isLocked && (
                            <svg className="inline-block" width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
                              <circle cx="3" cy="3" r="1"/><circle cx="7" cy="3" r="1"/>
                              <circle cx="3" cy="8" r="1"/><circle cx="7" cy="8" r="1"/>
                              <circle cx="3" cy="13" r="1"/><circle cx="7" cy="13" r="1"/>
                            </svg>
                          )}
                        </td>
                        <td colSpan={role === 'admin' ? 6 : 5} className="px-4 py-1.5">
                          {!isLocked && editingLine?.id === line.id ? (
                            <input
                              autoFocus
                              className="w-full text-xs font-bold uppercase tracking-widest outline-none rounded px-1"
                              style={{ color: 'var(--c-gold)', letterSpacing: '0.1em', background: 'var(--c-surface)', border: '1px solid var(--c-rim)' }}
                              value={editingLine.name}
                              onChange={e => setEditingLine({ id: line.id, name: e.target.value })}
                              onBlur={() => saveLineName(line.id, editingLine.name)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveLineName(line.id, editingLine.name)
                                if (e.key === 'Escape') setEditingLine(null)
                              }}
                            />
                          ) : (
                            <span
                              className={!isLocked ? 'cursor-text text-xs font-bold uppercase tracking-widest' : 'text-xs font-bold uppercase tracking-widest'}
                              style={{ color: 'var(--c-gold)', letterSpacing: '0.1em' }}
                              onClick={() => !isLocked && setEditingLine({ id: line.id, name: line.name })}
                            >
                              {line.name}
                            </span>
                          )}
                        </td>
                        {!isLocked && (
                          <td className="px-2 py-2.5 text-right">
                            <button aria-label="Eliminar sección" onClick={() => setDeleteConfirmLine(line)} className="btn-delete p-1.5 rounded-lg inline-flex items-center justify-center transition-colors" onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-rose-bg)' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  }

                  if (line.display_type === 'note') {
                    return (
                      <tr key={line.id} draggable={!isLocked} onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
                        className={isLocked ? '' : 'cursor-grab active:cursor-grabbing'} style={rowStyle}>
                        <td className="px-2 py-2.5 text-center text-xs" style={{ color: 'var(--c-ghost)' }}>
                          {!isLocked && (
                            <svg className="inline-block" width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
                              <circle cx="3" cy="3" r="1"/><circle cx="7" cy="3" r="1"/>
                              <circle cx="3" cy="8" r="1"/><circle cx="7" cy="8" r="1"/>
                              <circle cx="3" cy="13" r="1"/><circle cx="7" cy="13" r="1"/>
                            </svg>
                          )}
                        </td>
                        <td colSpan={role === 'admin' ? 6 : 5} className="px-4 py-1.5">
                          {!isLocked && editingLine?.id === line.id ? (
                            <input
                              autoFocus
                              className="w-full text-xs italic outline-none rounded px-1"
                              style={{ color: 'var(--c-ghost)', background: 'var(--c-surface)', border: '1px solid var(--c-rim)' }}
                              value={editingLine.name}
                              onChange={e => setEditingLine({ id: line.id, name: e.target.value })}
                              onBlur={() => saveLineName(line.id, editingLine.name)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') saveLineName(line.id, editingLine.name)
                                if (e.key === 'Escape') setEditingLine(null)
                              }}
                            />
                          ) : (
                            <span
                              className={!isLocked ? 'cursor-text text-xs italic' : 'text-xs italic'}
                              style={{ color: 'var(--c-ghost)' }}
                              onClick={() => !isLocked && setEditingLine({ id: line.id, name: line.name })}
                            >
                              {line.name}
                            </span>
                          )}
                        </td>
                        {!isLocked && (
                          <td className="px-2 py-2.5 text-right">
                            <button aria-label="Eliminar nota" onClick={() => setDeleteConfirmLine(line)} className="btn-delete p-1.5 rounded-lg inline-flex items-center justify-center transition-colors" onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-rose-bg)' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  }

                  if (line.display_type === 'discount') {
                    return (
                      <tr key={line.id} draggable={line.display_type !== 'discount' && !isLocked} onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
                        className={line.display_type !== 'discount' && !isLocked ? 'cursor-grab active:cursor-grabbing' : ''} style={{ ...rowStyle, background: 'var(--c-panel)', opacity: line.discount_approval_status === 'pending' ? 0.6 : 1 }}>
                        <td className="px-2 py-3.5 text-center text-xs" style={{ color: 'var(--c-ghost)' }}>
                          {!isLocked && (
                            <svg className="inline-block" width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
                              <circle cx="3" cy="3" r="1"/><circle cx="7" cy="3" r="1"/>
                              <circle cx="3" cy="8" r="1"/><circle cx="7" cy="8" r="1"/>
                              <circle cx="3" cy="13" r="1"/><circle cx="7" cy="13" r="1"/>
                            </svg>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium" style={{ color: 'var(--c-amber)' }}>
                          {line.name}
                          {line.discount_approval_status === 'pending' && (
                            <span className="ml-2 inline-flex items-center gap-1.5">
                              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                style={{ background: 'var(--c-amber-bg, rgba(251,191,36,0.12))', color: 'var(--c-amber)', border: '1px solid rgba(251,191,36,0.3)' }}>
                                {line.pending_discount_percent != null
                                  ? `Desc. ${Number(line.pending_discount_percent).toFixed(0)}% — Pendiente`
                                  : 'Pendiente de aprobación'}
                              </span>
                              {line.pending_approval_id && (
                                <button
                                  aria-label="Cancelar solicitud de descuento"
                                  onClick={() => cancelDiscountRequest(line.pending_approval_id!)}
                                  className="text-xs px-1.5 py-0.5 rounded font-semibold transition-colors"
                                  style={{ color: 'var(--c-rose)', border: '1px solid var(--c-rose)', background: 'transparent' }}
                                >
                                  Cancelar
                                </button>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5"></td>
                        <td className="px-4 py-3.5"></td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs">
                          {isLocked ? (
                            <span style={{ color: 'var(--c-amber)' }}>{line.discount_percent}%</span>
                          ) : (
                            <input type="number" step="0.01" min="0" max="100"
                              key={`${line.discount_percent}-${line.discount_approval_status ?? ''}`}
                              defaultValue={line.discount_percent}
                              disabled={line.discount_approval_status === 'pending'}
                              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                              onBlur={e => { const val = Number(e.target.value); if (val !== Number(line.discount_percent)) updateField(line.id, 'discount_percent', val) }}
                              className="w-full text-right outline-none rounded transition-all px-1 py-1 disabled:cursor-not-allowed"
                              style={{ background: 'var(--c-card)', color: 'var(--c-amber)', border: '1px solid var(--c-rim)' }}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-xs font-medium" style={{ color: 'var(--c-amber)' }}>
                          {Number(line.subtotal) < 0 ? '-' : ''}${Math.abs(Number(line.subtotal)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        {role === 'admin' && <td className="px-4 py-3.5"></td>}
                        {!isLocked && (
                          <td className="px-2 py-3.5 text-right">
                            <button aria-label="Eliminar descuento" onClick={() => setDeleteConfirmLine(line)} className="btn-delete p-1.5 rounded-lg inline-flex items-center justify-center transition-colors" onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-rose-bg)' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  }

                  const margin = Number(line.margin_amount)
                  const sub = Number(line.subtotal)
                  const marginPct = sub > 0 ? (margin / sub) * 100 : 0
                  const stale = staleMap.get(line.id)
                  const isDeletedProduct = stale?.reason === 'product_deleted'
                  const isStalePrice = stale && stale.reason !== 'product_deleted'
                  const hasManual = line.unit_price_mxn_manual !== null
                  const currentSuggested = isStalePrice && stale.new_suggested != null
                    ? stale.new_suggested
                    : Number(line.unit_price_mxn_suggested)
                  const manualDiffersFromCurrent = hasManual &&
                    Math.abs(Number(line.unit_price_mxn_manual) - currentSuggested) > 0.005
                  const canUseSuggested = !isDeletedProduct && manualDiffersFromCurrent

                  return (
                    <tr key={line.id} draggable={!isLocked} onDragStart={() => handleDragStart(index)} onDragEnter={() => handleDragEnter(index)} onDragEnd={handleDragEnd} onDragOver={e => e.preventDefault()}
                      className={isLocked ? '' : 'tr-hover cursor-grab active:cursor-grabbing transition-colors'} style={rowStyle}>
                      <td className="px-2 py-3 text-center text-xs" style={{ color: 'var(--c-ghost)' }}>
                        {!isLocked && (
                            <svg className="inline-block" width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
                              <circle cx="3" cy="3" r="1"/><circle cx="7" cy="3" r="1"/>
                              <circle cx="3" cy="8" r="1"/><circle cx="7" cy="8" r="1"/>
                              <circle cx="3" cy="13" r="1"/><circle cx="7" cy="13" r="1"/>
                            </svg>
                          )}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--c-ink)' }}>
                        {line.name}
                        {!isLocked && isDeletedProduct && (
                          <span
                            className="ml-2 inline-flex items-center gap-1 align-middle"
                            title="Producto no disponible en el catálogo. Elimina o reemplaza la línea."
                            style={{ color: 'var(--c-ghost)' }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                            </svg>
                            <span className="text-xs font-medium">No disponible</span>
                          </span>
                        )}
                        {!isLocked && isStalePrice && stale && (
                          <span className="ml-2 inline-flex items-center gap-1.5 align-middle" title={buildTooltip(stale, hasManual)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/>
                              <line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            <button
                              type="button"
                              onClick={() => openRefreshLineModal(line.id, 'preserve_manual')}
                              disabled={busy}
                              className="text-xs font-semibold underline disabled:opacity-50"
                              style={{ color: '#B45309' }}
                            >
                              Actualizar
                            </button>
                          </span>
                        )}
                        {!isLocked && canUseSuggested && (
                          <button
                            type="button"
                            onClick={() => openRefreshLineModal(line.id, 'use_suggested')}
                            disabled={busy}
                            className="ml-2 text-xs font-semibold underline disabled:opacity-50 align-middle"
                            style={{ color: 'var(--c-navy)' }}
                            title={`Reemplazar precio manual ($${Number(line.unit_price_mxn_manual).toLocaleString('es-MX', { minimumFractionDigits: 2 })}) por precio sugerido ($${currentSuggested.toLocaleString('es-MX', { minimumFractionDigits: 2 })})`}
                          >
                            Usar precio sugerido
                          </button>
                        )}
                        {line.discount_approval_status === 'pending' && (
                          <span className="ml-2 inline-flex items-center gap-1.5">
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                              style={{ background: 'var(--c-amber-bg, rgba(251,191,36,0.12))', color: 'var(--c-amber)', border: '1px solid rgba(251,191,36,0.3)' }}>
                              Desc. {Number(line.pending_discount_percent ?? 0).toFixed(0)}% — Pendiente
                            </span>
                            {line.pending_approval_id && (
                              <button
                                aria-label="Cancelar solicitud de descuento"
                                onClick={() => cancelDiscountRequest(line.pending_approval_id!)}
                                className="text-xs px-1.5 py-0.5 rounded font-semibold transition-colors"
                                style={{ color: 'var(--c-rose)', border: '1px solid var(--c-rose)', background: 'transparent' }}
                              >
                                Cancelar
                              </button>
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isLocked ? (
                          <span className="font-mono text-xs" style={{ color: 'var(--c-dim)' }}>{Math.floor(Number(line.qty ?? 1))}</span>
                        ) : (
                          <input type="number" min="1" step="1"
                            defaultValue={Math.floor(Number(line.qty ?? 1))}
                            className={`w-16 ${inputCls}`} style={inputStyle}
                            onFocus={e => (e.target.style.borderColor = 'var(--c-navy)')}
                            onBlur={e => {
                              e.target.style.borderColor = 'var(--c-rim)'
                              const v = Math.floor(Math.max(1, Number(e.target.value) || 1))
                              e.target.value = String(v)
                              if (String(v) !== String(Math.floor(Number(line.qty ?? 1)))) updateField(line.id, 'qty', v)
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isLocked || !canSetManualPrice(role ?? '') ? (
                          <span className="font-mono text-xs" style={{ color: 'var(--c-dim)' }}>${Number(!canSetManualPrice(role ?? '') ? line.unit_price_mxn_suggested : line.unit_price_mxn_effective).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <input type="number" min="0" step="0.01"
                            defaultValue={Number(line.unit_price_mxn_effective).toFixed(2)}
                            className={`w-24 ${inputCls}`} style={inputStyle}
                            onFocus={e => (e.target.style.borderColor = 'var(--c-navy)')}
                            onBlur={e => {
                              e.target.style.borderColor = 'var(--c-rim)'
                              const v = Number(e.target.value)
                              if (v >= 0) updateField(line.id, 'unit_price_mxn_manual', v)
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isLocked || line.discount_approval_status === 'pending' ? (
                          <span className="font-mono text-xs" style={{ color: 'var(--c-dim)' }}>{Number(line.discount_percent).toFixed(0)}%</span>
                        ) : (
                          <input type="number" min="0" max="100" step="1"
                            defaultValue={Number(line.discount_percent).toFixed(0)}
                            className={`w-16 ${inputCls}`} style={inputStyle}
                            onFocus={e => (e.target.style.borderColor = 'var(--c-navy)')}
                            onBlur={e => {
                              e.target.style.borderColor = 'var(--c-rim)'
                              const v = Number(e.target.value)
                              if (v >= 0 && v <= 100 && v !== Number(line.discount_percent)) updateField(line.id, 'discount_percent', v)
                            }}
                            onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium" style={{ color: 'var(--c-ink)' }}>
                        ${sub.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      {role === 'admin' && showMargin && (
                        <td className="px-4 py-3 text-right">
                          <span className="text-xs font-mono font-medium" style={{ color: margin >= 0 ? 'var(--c-mint)' : 'var(--c-rose)' }}>
                            ${margin.toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                            <span className="ml-1" style={{ color: 'var(--c-ghost)' }}>({marginPct.toFixed(1)}%)</span>
                          </span>
                        </td>
                      )}
                      {!isLocked && (
                        <td className="px-2 py-3 text-right">
                          <button aria-label="Eliminar línea" onClick={() => setDeleteConfirmLine(line)} className="btn-delete p-1.5 rounded-lg inline-flex items-center justify-center transition-colors" onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-rose-bg)' }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totals footer */}
          <div className="px-5 py-4" style={{ borderTop: '1px solid var(--c-rim)', background: 'var(--c-panel)' }}>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
              <div className="text-sm" style={{ color: 'var(--c-dim)' }}>
                Vehículos: <span className="font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>{unitCount} unidades</span>
              </div>
              <div className="flex flex-col items-end gap-3">
                {/* Pills de desglose por unidad */}
                <div className="flex flex-wrap justify-end gap-2 text-xs">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line)' }}>
                    <span style={{ color: 'var(--c-dim)' }}>Subtotal</span>
                    <span className="font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>${totals.untaxed.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </span>
                  {(() => {
                    const dl = lines.find(l => l.display_type === 'discount' && l.discount_approval_status !== 'pending')
                    if (!dl) return null
                    return (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line)' }}>
                        <span style={{ color: 'var(--c-dim)' }}>Descuento Global ({dl.discount_percent}%)</span>
                        <span className="font-mono font-semibold" style={{ color: 'var(--c-amber)' }}>
                          -${Math.abs(Number(dl.subtotal)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </span>
                    )
                  })()}
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line)' }}>
                    <span style={{ color: 'var(--c-dim)' }}>IVA</span>
                    <span className="font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>${totals.tax.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--c-surface)', border: '1px solid var(--c-line)' }}>
                    <span style={{ color: 'var(--c-dim)' }}>{isShowroom ? 'Total' : 'Total por unidad'}</span>
                    <span className="font-mono font-semibold" style={{ color: 'var(--c-ink)' }}>${totals.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                  </span>
                </div>
                {/* Total Flota destacado en cyan — solo para cotizaciones de proyecto */}
                {!isShowroom && (
                  <div className="flex justify-end">
                    <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl" style={{ background: 'rgba(6,182,212,0.08)', border: '1.5px solid rgba(6,182,212,0.4)' }}>
                      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(6,182,212,0.7)' }}>Total Flota · {unitCount} unidades</span>
                      <span className="font-mono text-xl font-bold" style={{ color: 'rgb(6,182,212)' }}>${(totals.total * unitCount).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</span>
                    </div>
                  </div>
                )}
                {role === 'admin' && showMargin && (
                  <div className="flex justify-end">
                    <span className="text-xs font-mono" style={{ color: totals.margin >= 0 ? 'var(--c-mint)' : 'var(--c-rose)' }}>
                      {isShowroom
                        ? `Margen: $${totals.margin.toLocaleString('es-MX', { minimumFractionDigits: 0 })} (${totals.marginPct.toFixed(1)}%)`
                        : <>
                            Margen unitario: ${totals.margin.toLocaleString('es-MX', { minimumFractionDigits: 0 })} ({totals.marginPct.toFixed(1)}%)
                            <span style={{ color: 'var(--c-ghost)', margin: '0 0.5rem' }}>|</span>
                            Margen total: ${(totals.margin * unitCount).toLocaleString('es-MX', { minimumFractionDigits: 0 })}
                          </>
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prompt modals */}
      {textPrompt && (
        <PromptModal
          title={textPrompt === 'section' ? 'Nueva sección' : 'Nueva nota'}
          label={textPrompt === 'section' ? 'Título de sección' : 'Texto de la nota'}
          placeholder={textPrompt === 'section' ? 'Ej: Accesorios' : 'Ej: Incluye instalación'}
          onConfirm={value => { addTextLine(textPrompt, value); setTextPrompt(null) }}
          onCancel={() => setTextPrompt(null)}
        />
      )}
      {discountPrompt && (
        <PromptModal
          title="Descuento global"
          label="Porcentaje de descuento"
          type="number"
          placeholder="Ej: 10"
          min="0"
          max="100"
          step="0.01"
          onConfirm={value => { addDiscountLine(value); setDiscountPrompt(false) }}
          onCancel={() => setDiscountPrompt(false)}
        />
      )}
      {plantillaPrompt && (
        <PlantillaModal
          onApply={applyPlantilla}
          onClose={() => setPlantillaPrompt(false)}
        />
      )}

      {/* Block B: confirm delete */}
      {deleteConfirmLine && (
        <ConfirmModal
          message={
            deleteConfirmLine.display_type === 'product'
              ? `¿Eliminar "${deleteConfirmLine.name}"?`
              : `¿Eliminar esta ${deleteConfirmLine.display_type === 'section' ? 'sección' : deleteConfirmLine.display_type === 'note' ? 'nota' : 'línea de descuento'}?`
          }
          confirmLabel="Eliminar"
          onConfirm={() => { deleteLine(deleteConfirmLine.id); setDeleteConfirmLine(null) }}
          onCancel={() => setDeleteConfirmLine(null)}
        />
      )}
      {clearConfirm && (
        <ConfirmModal
          message="¿Seguro que deseas eliminar todas las líneas? Esta acción no se puede deshacer."
          confirmLabel="Limpiar"
          onConfirm={() => { clearLines(); setClearConfirm(false) }}
          onCancel={() => setClearConfirm(false)}
        />
      )}
      {refreshModal && (
        <RefreshPricesModal
          title={refreshModal.title}
          rows={refreshModal.rows}
          mode={refreshModal.mode}
          busy={busy}
          onConfirm={confirmRefresh}
          onCancel={() => setRefreshModal(null)}
        />
      )}
    </div>
  )
}
