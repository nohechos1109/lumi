'use client'

import React, { useState, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import { usePopoverPosition } from '@/components/ui/usePopoverPosition'

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtDate(date: string) {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}
function fmtTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const isPM = h >= 12
  const h12  = h % 12 === 0 ? 12 : h % 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${isPM ? 'PM' : 'AM'}`
}
function toDatetimeLocal(date: string, time: string) {
  if (!date) return ''
  return `${date}T${time}`
}

const MINS = [0, 15, 30, 45]

const spinnerCol = { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: 2 }
const spinBtn = {
  width: 32, height: 28, border: '1px solid #D8E1EC', borderRadius: 8,
  background: '#F4F7FA', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: '#667788', transition: 'background 120ms',
}
const timeInput = {
  width: 40, textAlign: 'center' as const, border: 'none', outline: 'none',
  background: 'transparent', fontSize: 20, fontWeight: 700, color: '#0C1524',
  lineHeight: 1, padding: '4px 0', cursor: 'text', fontVariantNumeric: 'tabular-nums',
}

function ChevUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
    </svg>
  )
}
function ChevDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function TimeSpinner({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
  function incrH() { let nh = h12 + 1; if (nh > 12) nh = 1; update(h12ToH24(nh), minute) }
  function decrH() { let nh = h12 - 1; if (nh < 1) nh = 12; update(h12ToH24(nh), minute) }
  function incrM() { const idx = MINS.indexOf(minute); update(h24, MINS[(idx + 1) % MINS.length]) }
  function decrM() { const idx = MINS.indexOf(minute); update(h24, MINS[(idx - 1 + MINS.length) % MINS.length]) }
  function toggleAP() { update(isPM ? h24 - 12 : h24 + 12, minute) }
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Hour */}
      <div style={spinnerCol}>
        <button type="button" onClick={incrH} style={spinBtn} onMouseEnter={e => (e.currentTarget.style.background = '#E8EEF6')} onMouseLeave={e => (e.currentTarget.style.background = '#F4F7FA')}>
          <ChevUp />
        </button>
        <input
          type="text" inputMode="numeric"
          value={rawH}
          onChange={e => setRawH(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={commitH}
          style={timeInput}
        />
        <button type="button" onClick={decrH} style={spinBtn} onMouseEnter={e => (e.currentTarget.style.background = '#E8EEF6')} onMouseLeave={e => (e.currentTarget.style.background = '#F4F7FA')}>
          <ChevDown />
        </button>
      </div>

      <span style={{ fontSize: 22, fontWeight: 700, color: '#BBC8D8', lineHeight: 1, marginBottom: 2 }}>:</span>

      {/* Minute */}
      <div style={spinnerCol}>
        <button type="button" onClick={incrM} style={spinBtn} onMouseEnter={e => (e.currentTarget.style.background = '#E8EEF6')} onMouseLeave={e => (e.currentTarget.style.background = '#F4F7FA')}>
          <ChevUp />
        </button>
        <input
          type="text" inputMode="numeric"
          value={rawM}
          onChange={e => setRawM(e.target.value.replace(/\D/g, '').slice(0, 2))}
          onBlur={commitM}
          style={timeInput}
        />
        <button type="button" onClick={decrM} style={spinBtn} onMouseEnter={e => (e.currentTarget.style.background = '#E8EEF6')} onMouseLeave={e => (e.currentTarget.style.background = '#F4F7FA')}>
          <ChevDown />
        </button>
      </div>

      {/* AM/PM toggle */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 4 }}>
        <button
          type="button"
          onClick={() => !isPM && toggleAP()}
          style={{
            padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
            background: !isPM ? '#1B3461' : '#F0F4FA',
            color: !isPM ? '#fff' : '#8899AA',
            transition: 'background 150ms, color 150ms',
          }}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => isPM && toggleAP()}
          style={{
            padding: '5px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
            background: isPM ? '#1B3461' : '#F0F4FA',
            color: isPM ? '#fff' : '#8899AA',
            transition: 'background 150ms, color 150ms',
          }}
        >
          PM
        </button>
      </div>
    </div>
  )
}

interface Props {
  name: string
  placeholder?: string
  defaultValue?: string
}

export default function SingleDateTimePicker({ name, placeholder = 'Seleccionar fecha y hora', defaultValue }: Props) {
  const { open, pos, btnRef, panelRef, toggle, setOpen } = usePopoverPosition(340)

  const [selected, setSelected] = useState<Date | undefined>(() => {
    if (!defaultValue) return undefined
    const d = new Date(defaultValue)
    return isNaN(d.getTime()) ? undefined : d
  })
  const [time, setTime] = useState(() => {
    if (!defaultValue) return '08:00'
    const d = new Date(defaultValue)
    if (isNaN(d.getTime())) return '08:00'
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  })

  const dateStr  = selected ? toISO(selected) : ''
  const value    = toDatetimeLocal(dateStr, time)
  const hasValue = !!dateStr

  const label = hasValue ? `${fmtDate(dateStr)}  ${fmtTime(time)}` : null

  function handleClear() {
    setSelected(undefined)
    setTime('08:00')
    setOpen(false)
  }

  return (
    <>
      <style>{`
        .sdtp-root {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 13px; color: #0C1524;
          padding: 12px 14px 0 14px; width: 280px;
        }
        .sdtp-months { display: flex; }
        .sdtp-month  { width: 100%; }
        .sdtp-caption {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 10px;
        }
        .sdtp-caption-label { font-size: 13px; font-weight: 700; color: #0C1524; text-transform: capitalize; letter-spacing: -0.01em; }
        .sdtp-nav { display: flex; gap: 4px; }
        .sdtp-nav button {
          width: 26px; height: 26px; border-radius: 7px;
          border: 1px solid #D8E1EC; background: #fff;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #445566;
          transition: background 120ms; padding: 0;
        }
        .sdtp-nav button:hover { background: #ECF0F6; }
        .sdtp-head-row { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 2px; }
        .sdtp-head-cell {
          text-align: center; font-size: 9.5px; font-weight: 700;
          color: #9AABB8; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 0;
        }
        .sdtp-tbody { display: flex; flex-direction: column; gap: 1px; }
        .sdtp-week  { display: grid; grid-template-columns: repeat(7, 1fr); }
        .sdtp-day {
          position: relative; height: 32px;
          display: flex; align-items: center; justify-content: center;
        }
        .sdtp-day button, .sdtp-day-button {
          width: 28px; height: 28px; border-radius: 50%;
          border: none; background: transparent; cursor: pointer;
          font-size: 12px; font-weight: 500; color: #0C1524;
          transition: background 120ms, color 120ms, transform 80ms;
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1; padding: 0;
        }
        .sdtp-day button:hover:not(:disabled) { background: #ECF0F6; transform: scale(1.08); }
        .sdtp-day button:disabled { color: #C8D4E0; cursor: default; }
        .sdtp-today button { font-weight: 700; color: #2563EB; }
        .sdtp-today button::after {
          content: ''; position: absolute; bottom: 3px; left: 50%;
          transform: translateX(-50%); width: 3px; height: 3px;
          border-radius: 50%; background: #2563EB;
        }
        .sdtp-selected button {
          background: #1B3461 !important; color: #fff !important;
          font-weight: 700; box-shadow: 0 2px 8px rgba(27,52,97,0.3);
          transform: scale(1.06);
        }
        .sdtp-selected button::after { display: none; }
        .sdtp-outside button { color: #C8D4E0; }
        @keyframes sdtp-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <input type="hidden" name={name} value={value} />

      {/* Trigger */}
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
        <span className="flex-1 truncate text-xs" style={{ fontFamily: 'system-ui', letterSpacing: '0.01em' }}>
          {label ?? placeholder}
        </span>
        {hasValue && (
          <span
            role="button"
            aria-label="Limpiar"
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

      {/* Popover */}
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
            border: '1px solid #D8E1EC',
            boxShadow: '0 12px 40px rgba(15,23,42,0.16), 0 2px 8px rgba(15,23,42,0.06)',
            animation: 'sdtp-in 140ms cubic-bezier(0.16,1,0.3,1)',
            overflow: 'hidden',
          }}
        >
          {/* Calendar */}
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={setSelected}
            locale={es}
            classNames={{
              root:          'sdtp-root',
              months:        'sdtp-months',
              month:         'sdtp-month',
              month_caption: 'sdtp-caption',
              caption_label: 'sdtp-caption-label',
              nav:           'sdtp-nav',
              month_grid:    '',
              weekdays:      'sdtp-head-row',
              weekday:       'sdtp-head-cell',
              weeks:         'sdtp-tbody',
              week:          'sdtp-week',
              day:           'sdtp-day',
              day_button:    'sdtp-day-button',
              today:         'sdtp-today',
              selected:      'sdtp-selected',
              outside:       'sdtp-outside',
              disabled:      '',
            }}
            components={{
              Chevron: ({ orientation }) => (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {orientation === 'left'
                    ? <path d="m15 18-6-6 6-6"/>
                    : <path d="m9 18 6-6-6-6"/>}
                </svg>
              ),
            }}
          />

          {/* Time section */}
          <div style={{ borderTop: '1px solid #EEF2F8', background: '#FAFBFD' }}>
            <div style={{ padding: '4px 14px 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9AABB8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#9AABB8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Hora
              </span>
            </div>
            <div style={{ padding: '8px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TimeSpinner value={time} onChange={setTime} />
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', borderTop: '1px solid #EEF2F8',
            }}
          >
            <button
              type="button"
              onClick={handleClear}
              style={{
                fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8,
                background: 'transparent', color: '#9AABB8', border: 'none', cursor: 'pointer',
              }}
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 8,
                background: '#1B3461', color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
