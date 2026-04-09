'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { NavItem } from './nav-types'
import AppLauncherPanel from './AppLauncherPanel'

interface Props { items: NavItem[] }

export default function AppLauncherButton({ items }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
        style={{
          color: open ? 'var(--c-navy)' : 'var(--c-dim)',
          background: open ? 'var(--c-navy-bg)' : 'transparent',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'var(--c-hover)' }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        aria-label="Abrir menú de módulos"
        title="Módulos"
      >
        {/* Waffle icon — 3×3 grid of dots */}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect x="1"  y="1"  width="4" height="4" rx="1" />
          <rect x="7"  y="1"  width="4" height="4" rx="1" />
          <rect x="13" y="1"  width="4" height="4" rx="1" />
          <rect x="1"  y="7"  width="4" height="4" rx="1" />
          <rect x="7"  y="7"  width="4" height="4" rx="1" />
          <rect x="13" y="7"  width="4" height="4" rx="1" />
          <rect x="1"  y="13" width="4" height="4" rx="1" />
          <rect x="7"  y="13" width="4" height="4" rx="1" />
          <rect x="13" y="13" width="4" height="4" rx="1" />
        </svg>
      </button>

      {open && typeof window !== 'undefined' &&
        createPortal(
          <AppLauncherPanel items={items} onClose={() => setOpen(false)} />,
          document.body
        )
      }
    </>
  )
}
