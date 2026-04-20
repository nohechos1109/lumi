'use client'

import { usePopoverPosition } from './usePopoverPosition'

interface Option {
  value: string
  label: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder: string
}

export default function FilterSelect({ value, onChange, options, placeholder }: Props) {
  const { open, setOpen, pos, btnRef, panelRef, toggle } = usePopoverPosition()

  const selected = options.find(o => o.value === value)
  const isActive = !!value

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger pill */}
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="flex items-center gap-1.5 h-8 pl-3.5 pr-2.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap"
        style={{
          background: isActive ? 'var(--c-navy-bg)' : 'var(--c-card)',
          border: isActive ? '1.5px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
          color: isActive ? 'var(--c-navy)' : 'var(--c-dim)',
          boxShadow: isActive ? 'none' : '0 1px 3px rgba(15,23,42,0.04)',
        }}
      >
        <span>{selected ? selected.label : placeholder}</span>

        {isActive ? (
          /* Clear X */
          <span
            role="button"
            onClick={e => { e.stopPropagation(); onChange(''); setOpen(false) }}
            className="flex items-center justify-center w-4 h-4 rounded-full ml-0.5 cursor-pointer"
            style={{ background: 'var(--c-navy-bd)', color: 'var(--c-navy)' }}
          >
            <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
            </svg>
          </span>
        ) : (
          /* Chevron */
          <svg
            width="10" height="10" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            style={{
              color: 'var(--c-ghost)',
              opacity: 0.6,
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        )}
      </button>

      {/* Dropdown panel */}
      {open && pos && (
        <div
          ref={panelRef}
          className="min-w-[168px] rounded-xl py-1 animate-fade-in"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            background: 'var(--c-panel)',
            border: '1px solid var(--c-rim)',
            boxShadow: '0 8px 24px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.05)',
          }}
        >
          {/* All / reset option */}
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left"
            style={{ color: !value ? 'var(--c-navy)' : 'var(--c-ghost)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="w-3.5 flex items-center justify-center shrink-0">
              {!value && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </span>
            {placeholder}
          </button>

          <div style={{ height: '1px', background: 'var(--c-rim)', margin: '2px 8px' }} />

          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-left"
              style={{ color: value === opt.value ? 'var(--c-navy)' : 'var(--c-ink)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="w-3.5 flex items-center justify-center shrink-0">
                {value === opt.value && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
