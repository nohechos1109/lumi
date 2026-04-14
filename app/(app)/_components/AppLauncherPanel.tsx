'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { NavItem } from './nav-types'
import { ICON_MAP } from './icon-map'
import SettingsModal from '@/app/(app)/admin/_components/SettingsModal'

interface Props {
  items: NavItem[]
  onClose: () => void
}

export default function AppLauncherPanel({ items, onClose }: Props) {
  const pathname = usePathname()
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 pb-8 overflow-y-auto"
      style={{ background: 'rgba(12,21,36,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="relative w-full max-w-2xl rounded-2xl p-8"
        style={{
          background: 'var(--c-panel)',
          border: '1px solid var(--c-rim)',
          boxShadow: '0 24px 64px rgba(27,52,97,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
            Módulos
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--c-ghost)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--c-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {items.map(item => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')

            const iconCircle = (
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
                style={{
                  background: item.color,
                  color: '#fff',
                  boxShadow: isActive
                    ? `0 0 0 3px ${item.color}55, 0 4px 12px ${item.color}44`
                    : '0 2px 8px rgba(0,0,0,0.12)',
                }}
              >
                {ICON_MAP[item.icon]}
              </div>
            )

            const label = (
              <span
                className="text-xs text-center leading-tight"
                style={{
                  color: isActive ? 'var(--c-navy)' : 'var(--c-ink)',
                  fontWeight: isActive ? 700 : 500,
                  fontFamily: 'var(--font-montserrat)',
                }}
              >
                {item.label}
              </span>
            )

            const itemClass = "group flex flex-col items-center gap-2.5 rounded-xl p-4 transition-all"
            const onEnter = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.background = 'var(--c-hover)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }
            const onLeave = (e: React.MouseEvent<HTMLElement>) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
            }

            if (item.href === '/admin/settings') {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className={itemClass}
                  style={{ cursor: 'pointer', border: 'none', background: 'transparent', textDecoration: 'none' }}
                  onMouseEnter={onEnter}
                  onMouseLeave={onLeave}
                >
                  {iconCircle}
                  {label}
                </button>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={itemClass}
                style={{ textDecoration: 'none' }}
                onMouseEnter={onEnter}
                onMouseLeave={onLeave}
              >
                {iconCircle}
                {label}
              </Link>
            )
          })}
        </div>
      </div>
    </div>

    {showSettings && (
      <SettingsModal onClose={() => { setShowSettings(false); onClose() }} />
    )}
    </>
  )
}
