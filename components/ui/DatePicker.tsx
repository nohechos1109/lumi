'use client'

import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import { usePopoverPosition } from '@/components/ui/usePopoverPosition'

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtDisplay(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

interface Props {
  name: string
  placeholder?: string
  defaultValue?: string
  min?: string
}

export default function DatePicker({ name, placeholder = 'Seleccionar fecha', defaultValue, min }: Props) {
  const { open, pos, btnRef, panelRef, toggle, setOpen } = usePopoverPosition(280)

  const [selected, setSelected] = useState<Date | undefined>(() => {
    if (!defaultValue) return undefined
    const d = new Date(defaultValue + 'T12:00:00')
    return isNaN(d.getTime()) ? undefined : d
  })

  const dateStr = selected ? toISO(selected) : ''
  const minDate = min ? new Date(min + 'T12:00:00') : undefined

  function handleClear() {
    setSelected(undefined)
    setOpen(false)
  }

  function handleSelect(day: Date | undefined) {
    setSelected(day)
    if (day) setOpen(false)
  }

  return (
    <>
      <style>{`
        .dp-root {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 13px; color: #0C1524;
          padding: 12px 14px 14px 14px; width: 260px;
        }
        .dp-months { display: flex; }
        .dp-month  { width: 100%; }
        .dp-caption {
          display: flex; align-items: center;
          justify-content: space-between; margin-bottom: 10px;
        }
        .dp-caption-label { font-size: 13px; font-weight: 700; color: #0C1524; text-transform: capitalize; letter-spacing: -0.01em; }
        .dp-nav { display: flex; gap: 4px; }
        .dp-nav button {
          width: 26px; height: 26px; border-radius: 7px;
          border: 1px solid #D8E1EC; background: #fff;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; color: #445566;
          transition: background 120ms; padding: 0;
        }
        .dp-nav button:hover { background: #ECF0F6; }
        .dp-head-row { display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 2px; }
        .dp-head-cell {
          text-align: center; font-size: 9.5px; font-weight: 700;
          color: #9AABB8; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 0;
        }
        .dp-tbody { display: flex; flex-direction: column; gap: 1px; }
        .dp-week  { display: grid; grid-template-columns: repeat(7, 1fr); }
        .dp-day {
          position: relative; height: 32px;
          display: flex; align-items: center; justify-content: center;
        }
        .dp-day button, .dp-day-button {
          width: 28px; height: 28px; border-radius: 50%;
          border: none; background: transparent; cursor: pointer;
          font-size: 12px; font-weight: 500; color: #0C1524;
          transition: background 120ms, color 120ms, transform 80ms;
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 1; padding: 0;
        }
        .dp-day button:hover:not(:disabled) { background: #ECF0F6; transform: scale(1.08); }
        .dp-day button:disabled { color: #C8D4E0; cursor: default; }
        .dp-today button { font-weight: 700; color: #2563EB; }
        .dp-today button::after {
          content: ''; position: absolute; bottom: 3px; left: 50%;
          transform: translateX(-50%); width: 3px; height: 3px;
          border-radius: 50%; background: #2563EB;
        }
        .dp-selected button {
          background: #1B3461 !important; color: #fff !important;
          font-weight: 700; box-shadow: 0 2px 8px rgba(27,52,97,0.3);
          transform: scale(1.06);
        }
        .dp-selected button::after { display: none; }
        .dp-outside button { color: #C8D4E0; }
        .dp-disabled button { color: #C8D4E0 !important; cursor: default !important; }
        @keyframes dp-in {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <input type="hidden" name={name} value={dateStr} />

      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="w-full text-sm rounded-xl px-4 py-2.5 flex items-center gap-2 text-left transition-colors"
        style={{
          background: 'var(--c-panel)',
          border: dateStr ? '1px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
          color: dateStr ? 'var(--c-ink)' : 'var(--c-ghost)',
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
          {dateStr ? fmtDisplay(dateStr) : placeholder}
        </span>
        {dateStr && (
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
            animation: 'dp-in 140ms cubic-bezier(0.16,1,0.3,1)',
            overflow: 'hidden',
          }}
        >
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            locale={es}
            disabled={minDate ? { before: minDate } : undefined}
            classNames={{
              root:          'dp-root',
              months:        'dp-months',
              month:         'dp-month',
              month_caption: 'dp-caption',
              caption_label: 'dp-caption-label',
              nav:           'dp-nav',
              month_grid:    '',
              weekdays:      'dp-head-row',
              weekday:       'dp-head-cell',
              weeks:         'dp-tbody',
              week:          'dp-week',
              day:           'dp-day',
              day_button:    'dp-day-button',
              today:         'dp-today',
              selected:      'dp-selected',
              outside:       'dp-outside',
              disabled:      'dp-disabled',
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

          <div
            style={{
              display: 'flex', justifyContent: 'flex-start', alignItems: 'center',
              padding: '8px 14px 10px', borderTop: '1px solid #EEF2F8',
            }}
          >
            <button
              type="button"
              onClick={handleClear}
              style={{
                fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8,
                background: 'transparent', color: '#9AABB8', border: 'none', cursor: 'pointer',
              }}
            >
              Borrar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
