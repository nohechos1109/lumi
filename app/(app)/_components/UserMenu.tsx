'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  username: string
  roleLabel: string
  userInitial: string
}

export default function UserMenu({ username, roleLabel, userInitial }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger — user chip */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
        style={{
          background: open ? 'var(--c-navy-bg)' : 'var(--c-base)',
          border: open ? '1px solid var(--c-navy-bd)' : '1px solid transparent',
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
          style={{
            background: 'var(--c-navy-bg)',
            color: 'var(--c-navy)',
            border: '1.5px solid var(--c-navy-bd)',
          }}
        >
          {userInitial}
        </div>
        <div className="hidden sm:block leading-tight text-left">
          <p className="text-xs font-semibold" style={{ color: 'var(--c-ink)' }}>{username}</p>
          <p className="text-[10px]" style={{ color: 'var(--c-ghost)' }}>{roleLabel}</p>
        </div>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth={2} strokeLinecap="round"
          className="hidden sm:block transition-transform"
          style={{ color: 'var(--c-ghost)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-xl py-1.5 z-50"
          style={{
            background: 'var(--c-panel)',
            border: '1px solid var(--c-rim)',
            boxShadow: '0 8px 24px rgba(27,52,97,0.12)',
          }}
        >
          {/* User info header */}
          <div className="px-4 py-2.5" style={{ borderBottom: '1px solid var(--c-rim)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--c-ink)' }}>{username}</p>
            <p className="text-[10px]" style={{ color: 'var(--c-ghost)' }}>{roleLabel}</p>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors text-left"
            style={{ color: 'var(--c-rose)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(209,44,60,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
