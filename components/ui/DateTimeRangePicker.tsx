'use client'

import React, { useState, useEffect } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import { usePopoverPosition } from '@/components/ui/usePopoverPosition'

function toISO(d: Date) { return d.toISOString().slice(0, 10) }

function fmtDate(date: string) {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function toDatetimeLocal(date: string, time: string) {
  if (!date) return ''
  return `${date}T${time}`
}

function displayLabel(startDate: string, endDate: string, startTime: string, endTime: string) {
  if (!startDate && !endDate) return null
  const start = startDate ? `${fmtDate(startDate)} ${startTime}` : '...'
  const end   = endDate   ? `${fmtDate(endDate)} ${endTime}`     : '...'
  return `${start} → ${end}`
}

const MINS = [0, 15, 30, 45]

function ChevUp() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  )
}
function ChevDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function SpinBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center rounded transition-colors hover:opacity-70"
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8899AA', padding: '1px 4px' }}
    >
      {children}
    </button>
  )
}

const INPUT_STYLE: React.CSSProperties = {
  background: 'transparent', border: 'none', outline: 'none',
  textAlign: 'center', width: '2rem', fontSize: '0.85rem',
  fontWeight: 600, color: '#0C1524', padding: '1px 0', cursor: 'text',
}

const CELL_STYLE: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  background: '#F4F7FA', border: '1px solid #D8E1EC',
  borderRadius: '0.5rem', padding: '2px 2px',
}

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts  = value.split(':')
  const h24    = parseInt(parts[0] ?? '8', 10)
  const minute = parseInt(parts[1] ?? '0', 10)
  const isPM   = h24 >= 12
  const h12    = h24 % 12 === 0 ? 12 : h24 % 12

  const [rawH, setRawH] = useState(String(h12).padStart(2, '0'))
  const [rawM, setRawM] = useState(String(minute).padStart(2, '0'))

  useEffect(() => { setRawH(String(h12).padStart(2, '0')) }, [h12])
  useEffect(() => { setRawM(String(minute).padStart(2, '0')) }, [minute])

  function update(newH24: number, newMin: number) {
    onChange(`${String(newH24).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`)
  }

  function h12ToH24(nh: number) {
    return isPM ? (nh === 12 ? 12 : nh + 12) : (nh === 12 ? 0 : nh)
  }

  function incrH() {
    let nh = h12 + 1; if (nh > 12) nh = 1
    update(h12ToH24(nh), minute)
  }
  function decrH() {
    let nh = h12 - 1; if (nh < 1) nh = 12
    update(h12ToH24(nh), minute)
  }
  function incrM() {
    const idx = MINS.indexOf(minute)
    update(h24, MINS[(idx + 1) % MINS.length])
  }
  function decrM() {
    const idx = MINS.indexOf(minute)
    update(h24, MINS[(idx - 1 + MINS.length) % MINS.length])
  }
  function toggleAP() {
    update(isPM ? h24 - 12 : h24 + 12, minute)
  }

  function commitH() {
    let n = parseInt(rawH, 10)
    if (isNaN(n) || n < 1) n = 1
    if (n > 12) n = 12
    update(h12ToH24(n), minute)
  }
  function commitM() {
    let n = parseInt(rawM, 10)
    if (isNaN(n)) n = 0
    n = Math.min(59, Math.max(0, n))
    const snapped = MINS.reduce((p, c) => Math.abs(c - n) < Math.abs(p - n) ? c : p)
    update(h24, snapped)
  }

  return (
    <div className="flex items-center gap-1.5">
      <div style={CELL_STYLE}>
        <SpinBtn onClick={incrH}><ChevUp /></SpinBtn>
        <input
          type="text" inputMode="numeric"
          value={rawH}
          onChange={e => setRawH(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={commitH}
          style={INPUT_STYLE}
        />
        <SpinBtn onClick={decrH}><ChevDown /></SpinBtn>
      </div>
      <span style={{ color: '#8899AA', fontWeight: 700, fontSize: '0.85rem' }}>:</span>
      <div style={CELL_STYLE}>
        <SpinBtn onClick={incrM}><ChevUp /></SpinBtn>
        <input
          type="text" inputMode="numeric"
          value={rawM}
          onChange={e => setRawM(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={commitM}
          style={INPUT_STYLE}
        />
        <SpinBtn onClick={decrM}><ChevDown /></SpinBtn>
      </div>
      <button
        type="button"
        onClick={toggleAP}
        className="font-semibold hover:opacity-75 transition-opacity"
        style={{
          fontSize: '0.7rem', padding: '0.25rem 0.4rem',
          background: isPM ? '#1B3461' : '#ECF0F6',
          color: isPM ? '#fff' : '#445566',
          border: 'none', cursor: 'pointer', borderRadius: '0.4rem',
          minWidth: '2.4rem',
        }}
      >
        {isPM ? 'PM' : 'AM'}
      </button>
    </div>
  )
}

interface Props {
  startName?: string
  endName?: string
  initialStart?: string | null
  initialEnd?: string | null
  onChange?: (startIso: string, endIso: string) => void
}

function parseIso(v: string | null | undefined): { date: string; time: string } {
  if (!v) return { date: '', time: '' }
  const d = new Date(v)
  if (isNaN(d.getTime())) return { date: '', time: '' }
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}` }
}

export default function DateTimeRangePicker({ startName, endName, initialStart, initialEnd, onChange }: Props) {
  const { open, pos, btnRef, panelRef, toggle, setOpen } = usePopoverPosition(450)
  const initStart = parseIso(initialStart)
  const initEnd = parseIso(initialEnd)
  const [range, setRange] = useState<DateRange | undefined>(
    initStart.date
      ? {
          from: new Date(`${initStart.date}T00:00:00`),
          to: initEnd.date ? new Date(`${initEnd.date}T00:00:00`) : undefined,
        }
      : undefined
  )
  const [startTime, setStartTime] = useState(initStart.time || '08:00')
  const [endTime, setEndTime]     = useState(initEnd.time || '17:00')

  const startDate  = range?.from ? toISO(range.from) : ''
  const endDate    = range?.to   ? toISO(range.to)   : ''
  const startValue = toDatetimeLocal(startDate, startTime)
  const endValue   = toDatetimeLocal(endDate, endTime)
  const hasValue   = !!(startDate || endDate)
  const label      = displayLabel(startDate, endDate, startTime, endTime)

  useEffect(() => {
    onChange?.(startValue, endValue)

  }, [startValue, endValue])

  function handleClear() {
    setRange(undefined)
    setOpen(false)
  }

  return (
    <>
      <style>{`
        .dtrp-root {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 13px;
          color: #0C1524;
          padding: 16px 16px 0 16px;
          width: 296px;
        }
        .dtrp-months { display: flex; }
        .dtrp-month  { width: 100%; }
        .dtrp-caption {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 12px;
        }
        .dtrp-caption-label {
          font-size: 13px; font-weight: 700; color: #0C1524;
          letter-spacing: -0.01em; text-transform: capitalize;
        }
        .dtrp-nav { display: flex; gap: 4px; }
        .dtrp-nav button {
          width: 28px; height: 28px; border-radius: 8px;
          border: 1px solid #D8E1EC; background: #fff;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #445566;
          transition: background 150ms, border-color 150ms; padding: 0;
        }
        .dtrp-nav button:hover { background: #ECF0F6; border-color: #B8C8DA; }
        .dtrp-head-row {
          display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 4px;
        }
        .dtrp-head-cell {
          text-align: center; font-size: 10px; font-weight: 600;
          color: #8899AA; text-transform: uppercase;
          letter-spacing: 0.05em; padding: 4px 0;
        }
        .dtrp-tbody { display: flex; flex-direction: column; gap: 2px; }
        .dtrp-week  { display: grid; grid-template-columns: repeat(7, 1fr); }
        .dtrp-day {
          position: relative; height: 34px;
          display: flex; align-items: center; justify-content: center;
        }
        .dtrp-day button, .dtrp-day-button {
          width: 30px; height: 30px; border-radius: 50%;
          border: none; background: transparent; cursor: pointer;
          font-size: 12.5px; font-weight: 500; color: #0C1524;
          transition: background 120ms, color 120ms, transform 80ms;
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1; padding: 0;
        }
        .dtrp-day button:hover:not(:disabled) { background: #ECF0F6; transform: scale(1.08); }
        .dtrp-day button:disabled { color: #B8C8DA; cursor: default; }
        .dtrp-today button { font-weight: 700; color: #2563EB; }
        .dtrp-today button::after {
          content: ''; position: absolute; bottom: 4px; left: 50%;
          transform: translateX(-50%); width: 4px; height: 4px;
          border-radius: 50%; background: #2563EB;
        }
        .dtrp-selected button,
        .dtrp-range-start button,
        .dtrp-range-end button {
          background: #1B3461 !important; color: #fff !important;
          font-weight: 700; box-shadow: 0 2px 8px rgba(27,52,97,0.32);
          transform: scale(1.05);
        }
        .dtrp-selected button::after,
        .dtrp-range-start button::after,
        .dtrp-range-end button::after { display: none; }
        .dtrp-range-middle { background: rgba(27,52,97,0.08); }
        .dtrp-range-middle button { color: #1B3461; font-weight: 600; }
        .dtrp-range-middle button:hover { background: rgba(27,52,97,0.14); }
        .dtrp-range-start {
          background: linear-gradient(to right, transparent 50%, rgba(27,52,97,0.08) 50%);
        }
        .dtrp-range-end {
          background: linear-gradient(to left, transparent 50%, rgba(27,52,97,0.08) 50%);
        }
        .dtrp-outside button { color: #B8C8DA; }
        @keyframes dtrp-in {
          from { opacity: 0; transform: translateY(-4px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>

      {startName ? <input type="hidden" name={startName} value={startValue} /> : null}
      {endName   ? <input type="hidden" name={endName}   value={endValue} />   : null}

      {/* ── Trigger ── */}
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="w-full text-sm rounded-xl px-4 py-2.5 flex items-center gap-2 text-left transition-colors"
        style={{
          background: 'var(--c-panel)',
          border: hasValue ? '1px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
          color: label ? 'var(--c-ink)' : 'var(--c-ghost)',
          cursor: 'pointer',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--c-ghost)', flexShrink: 0 }}>
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="flex-1 truncate font-mono text-xs">
          {label ?? 'Seleccionar rango de fechas'}
        </span>
        {hasValue && (
          <span
            role="button"
            aria-label="Limpiar selección"
            onClick={e => { e.stopPropagation(); handleClear() }}
            className="flex items-center justify-center w-4 h-4 rounded-full cursor-pointer"
            style={{ background: 'var(--c-rim-hi)', color: 'var(--c-ghost)' }}
          >
            <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
            </svg>
          </span>
        )}
      </button>

      {/* ── Popover ── */}
      {open && pos && (
        <div
          ref={panelRef}
          className="rounded-2xl"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            background: '#fff',
            border: '1px solid var(--c-rim)',
            boxShadow: '0 8px 32px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.08)',
            animation: 'dtrp-in 120ms ease-out',
          }}
        >
          {/* Phase hint */}
          {!range?.from && (
            <p className="text-[11px] px-4 pt-3 pb-0 font-semibold" style={{ color: 'var(--c-ghost)' }}>
              Selecciona fecha de inicio
            </p>
          )}
          {range?.from && !range?.to && (
            <p className="text-[11px] px-4 pt-3 pb-0 font-semibold" style={{ color: 'var(--c-ghost)' }}>
              Selecciona fecha límite
            </p>
          )}

          <DayPicker
            mode="range"
            selected={range}
            onSelect={setRange}
            locale={es}
            classNames={{
              root:          'dtrp-root',
              months:        'dtrp-months',
              month:         'dtrp-month',
              month_caption: 'dtrp-caption',
              caption_label: 'dtrp-caption-label',
              nav:           'dtrp-nav',
              month_grid:    '',
              weekdays:      'dtrp-head-row',
              weekday:       'dtrp-head-cell',
              weeks:         'dtrp-tbody',
              week:          'dtrp-week',
              day:           'dtrp-day',
              day_button:    'dtrp-day-button',
              today:         'dtrp-today',
              selected:      'dtrp-selected',
              range_start:   'dtrp-range-start',
              range_middle:  'dtrp-range-middle',
              range_end:     'dtrp-range-end',
              outside:       'dtrp-outside',
              disabled:      '',
            }}
            components={{
              Chevron: ({ orientation }) => (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {orientation === 'left'
                    ? <path d="m15 18-6-6 6-6"/>
                    : <path d="m9 18 6-6-6-6"/>}
                </svg>
              ),
            }}
          />

          {/* Time inputs */}
          <div
            className="grid grid-cols-2 gap-3 px-4 py-3"
            style={{ borderTop: '1px solid var(--c-rim)' }}
          >
            <div>
              <div className="text-[10px] font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8899AA' }}>
                Hora inicio
              </div>
              <TimeSelect value={startTime} onChange={setStartTime} />
            </div>
            <div>
              <div className="text-[10px] font-semibold mb-2 uppercase tracking-wide" style={{ color: '#8899AA' }}>
                Hora límite
              </div>
              <TimeSelect value={endTime} onChange={setEndTime} />
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex justify-between items-center px-4 py-3"
            style={{ borderTop: '1px solid #D8E1EC' }}
          >
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-75 transition-opacity"
              style={{ background: 'transparent', color: '#8899AA', border: 'none', cursor: 'pointer' }}
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity text-white"
              style={{ background: '#1B3461', border: 'none', cursor: 'pointer' }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
