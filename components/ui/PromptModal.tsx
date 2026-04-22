'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  title: string
  label: string
  type?: 'text' | 'number'
  placeholder?: string
  defaultValue?: string
  step?: string
  min?: string
  max?: string
  onConfirm: (value: string) => void
  onCancel: () => void
}

export default function PromptModal({
  title,
  label,
  type = 'text',
  placeholder,
  defaultValue = '',
  step,
  min,
  max,
  onConfirm,
  onCancel,
}: Props) {
  const [value, setValue] = useState(defaultValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (value.trim() === '') return
    onConfirm(value.trim())
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,16,0.5)', backdropFilter: 'blur(2px)' }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prompt-title"
        className="w-full max-w-sm rounded-2xl p-6 flex flex-col gap-5"
        style={{
          background: 'var(--c-card)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 8px 32px rgba(9,11,16,0.24)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <p id="prompt-title" className="text-base font-semibold" style={{ color: 'var(--c-ink)' }}>{title}</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              className="block text-xs font-semibold mb-1.5"
              style={{ color: 'var(--c-dim)' }}
            >
              {label}
            </label>
            <input
              ref={inputRef}
              type={type}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={placeholder}
              step={step}
              min={min}
              max={max}
              className="w-full"
              style={{ background: 'var(--c-panel)' }}
              required
            />
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-75"
              style={{
                background: 'transparent',
                color: 'var(--c-dim)',
                border: '1px solid var(--c-rim)',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-85"
              style={{ background: 'var(--c-navy)', color: '#FFFFFF' }}
            >
              Aceptar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
