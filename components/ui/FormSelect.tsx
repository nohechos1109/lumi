'use client'

import { useState } from 'react'
import { usePopoverPosition } from './usePopoverPosition'

interface Option {
  value: string
  label: string
}

interface Props {
  name?: string
  options: Option[]
  placeholder?: string
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export default function FormSelect({
  name,
  options,
  placeholder = '— Seleccionar —',
  value: controlledValue,
  defaultValue = '',
  onChange,
  disabled,
  className = 'w-full',
}: Props) {
  const { open, setOpen, pos, btnRef, panelRef, toggle } = usePopoverPosition(200)
  const [internalValue, setInternalValue] = useState(defaultValue)

  const value = controlledValue !== undefined ? controlledValue : internalValue
  const selected = options.find(o => o.value === value)

  function select(val: string) {
    if (controlledValue === undefined) setInternalValue(val)
    onChange?.(val)
    setOpen(false)
  }

  return (
    <>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        className={`${className} text-sm rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 text-left transition-colors`}
        style={{
          background: 'var(--c-panel)',
          border: value ? '1px solid var(--c-navy-bd)' : '1px solid var(--c-rim)',
          color: value ? 'var(--c-ink)' : 'var(--c-ghost)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{
            color: 'var(--c-ghost)',
            flexShrink: 0,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && pos && (
        <div
          ref={panelRef}
          className="rounded-xl py-1"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            minWidth: 180,
            background: 'var(--c-panel)',
            border: '1px solid var(--c-rim)',
            boxShadow: '0 8px 24px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.05)',
          }}
        >
          <button
            type="button"
            onClick={() => select('')}
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

          <div style={{ height: 1, background: 'var(--c-rim)', margin: '2px 8px' }} />

          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => select(opt.value)}
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
    </>
  )
}
