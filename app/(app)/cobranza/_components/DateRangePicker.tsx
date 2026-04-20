'use client'

import { DayPicker, type DateRange } from 'react-day-picker'
import { es } from 'react-day-picker/locale'
import { usePopoverPosition } from '@/components/ui/usePopoverPosition'

interface Props {
  dateFrom: string
  dateTo: string
  onChange: (from: string, to: string) => void
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10)
}

function fmtDisp(s: string) {
  const [y, m, d] = s.split('-')
  return `${d}/${m}/${y}`
}

function displayLabel(from: string, to: string) {
  if (!from && !to) return 'Todas las fechas'
  if (from && to)   return `${fmtDisp(from)} — ${fmtDisp(to)}`
  if (from)         return `Desde ${fmtDisp(from)}`
  return `Hasta ${fmtDisp(to)}`
}

export default function DateRangePicker({ dateFrom, dateTo, onChange }: Props) {
  const { open, setOpen, pos, btnRef, panelRef, toggle } = usePopoverPosition()

  const range: DateRange = {
    from: dateFrom ? new Date(dateFrom + 'T00:00:00') : undefined,
    to:   dateTo   ? new Date(dateTo   + 'T00:00:00') : undefined,
  }

  function handleSelect(r: DateRange | undefined) {
    const from = r?.from ? toISO(r.from) : ''
    const to   = r?.to   ? toISO(r.to)   : ''
    onChange(from, to)
    if (from && to) setOpen(false)
  }

  const hasValue = dateFrom || dateTo

  return (
    <>
      <style>{`
        .drp-root {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 13px;
          color: #0C1524;
          padding: 16px;
          width: 296px;
        }
        .drp-months { display: flex; }
        .drp-month  { width: 100%; }

        /* Caption */
        .drp-caption {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .drp-caption-label {
          font-size: 13px;
          font-weight: 700;
          color: #0C1524;
          letter-spacing: -0.01em;
          text-transform: capitalize;
        }
        .drp-nav {
          display: flex;
          gap: 4px;
        }
        .drp-nav button {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          border: 1px solid #D8E1EC;
          background: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #445566;
          transition: background 150ms, border-color 150ms;
          padding: 0;
        }
        .drp-nav button:hover {
          background: #ECF0F6;
          border-color: #B8C8DA;
        }

        /* Weekday header */
        .drp-head-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          margin-bottom: 4px;
        }
        .drp-head-cell {
          text-align: center;
          font-size: 10px;
          font-weight: 600;
          color: #8899AA;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 4px 0;
        }

        /* Weeks / Days */
        .drp-tbody { display: flex; flex-direction: column; gap: 2px; }
        .drp-week  {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .drp-day {
          position: relative;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .drp-day button, .drp-day-button {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 12.5px;
          font-weight: 500;
          color: #0C1524;
          transition: background 120ms, color 120ms, transform 80ms;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          padding: 0;
        }
        .drp-day button:hover:not(:disabled) {
          background: #ECF0F6;
          transform: scale(1.08);
        }
        .drp-day button:disabled {
          color: #B8C8DA;
          cursor: default;
        }

        /* Today */
        .drp-today button {
          font-weight: 700;
          color: #2563EB;
        }
        .drp-today button::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #2563EB;
        }

        /* Selected (start / end) */
        .drp-selected button,
        .drp-range-start button,
        .drp-range-end button {
          background: #2563EB !important;
          color: #fff !important;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(37,99,235,0.32);
          transform: scale(1.05);
        }
        .drp-selected button::after,
        .drp-range-start button::after,
        .drp-range-end button::after { display: none; }

        /* Range middle */
        .drp-range-middle {
          background: rgba(37,99,235,0.08);
        }
        .drp-range-middle button {
          color: #2563EB;
          font-weight: 600;
        }
        .drp-range-middle button:hover {
          background: rgba(37,99,235,0.14);
        }

        /* Range start/end — pill sides */
        .drp-range-start {
          background: linear-gradient(to right, transparent 50%, rgba(37,99,235,0.08) 50%);
        }
        .drp-range-end {
          background: linear-gradient(to left, transparent 50%, rgba(37,99,235,0.08) 50%);
        }

        /* Outside month */
        .drp-outside button {
          color: #B8C8DA;
        }

        /* Footer */
        .drp-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          margin-top: 8px;
          border-top: 1px solid #D8E1EC;
        }
        .drp-footer button {
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          transition: opacity 150ms;
        }
        .drp-footer button:hover { opacity: 0.75; }
        .drp-footer-clear {
          background: transparent;
          color: #8899AA;
        }
        .drp-footer-today {
          background: #ECF0F6;
          color: #1B3461;
        }
      `}</style>

      <div style={{ position: 'relative' }}>
        {/* ── Trigger ──────────────────────────────────────────── */}
        <button
          ref={btnRef}
          type="button"
          onClick={toggle}
          className="flex items-center gap-1.5 h-8 pl-3.5 pr-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
          style={{
            background: hasValue ? 'var(--c-navy-bg)' : 'var(--c-card)',
            border: hasValue ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
            color: hasValue ? 'var(--c-navy)' : 'var(--c-dim)',
            boxShadow: hasValue ? 'none' : '0 1px 3px rgba(15,23,42,0.04)',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, opacity: 0.7 }}>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          <span className="truncate" style={{ maxWidth: 160 }}>
            {displayLabel(dateFrom, dateTo)}
          </span>
          {hasValue ? (
            <span
              role="button"
              onClick={e => { e.stopPropagation(); onChange('', '') }}
              className="flex items-center justify-center w-4 h-4 rounded-full ml-0.5 cursor-pointer"
              style={{ background: 'var(--c-navy-bd)', color: 'var(--c-navy)' }}
            >
              <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
              </svg>
            </span>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              style={{ color: 'var(--c-ghost)', opacity: 0.6, transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          )}
        </button>

        {/* ── Popover ───────────────────────────────────────────── */}
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
              boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.06)',
              animation: 'drp-in 120ms ease-out',
            }}
          >
            <style>{`
              @keyframes drp-in {
                from { opacity: 0; transform: translateY(-4px) scale(0.98); }
                to   { opacity: 1; transform: translateY(0)    scale(1); }
              }
            `}</style>

            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleSelect}
              locale={es}
              classNames={{
                root:          'drp-root',
                months:        'drp-months',
                month:         'drp-month',
                month_caption: 'drp-caption',
                caption_label: 'drp-caption-label',
                nav:           'drp-nav',
                month_grid:    '',
                weekdays:      'drp-head-row',
                weekday:       'drp-head-cell',
                weeks:         'drp-tbody',
                week:          'drp-week',
                day:           'drp-day',
                day_button:    'drp-day-button',
                today:         'drp-today',
                selected:      'drp-selected',
                range_start:   'drp-range-start',
                range_middle:  'drp-range-middle',
                range_end:     'drp-range-end',
                outside:       'drp-outside',
                disabled:      'drp-disabled',
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
              footer={
                <div className="drp-footer">
                  <button
                    className="drp-footer-clear"
                    onClick={() => { onChange('', ''); setOpen(false) }}>
                    Borrar
                  </button>
                  <button
                    className="drp-footer-today"
                    onClick={() => {
                      const today = toISO(new Date())
                      onChange(today, today)
                      setOpen(false)
                    }}>
                    Hoy
                  </button>
                </div>
              }
            />
          </div>
        )}
      </div>
    </>
  )
}
