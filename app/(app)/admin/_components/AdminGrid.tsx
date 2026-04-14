'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { NavItem } from '@/app/(app)/_components/nav-types'
import { ICON_MAP } from '@/app/(app)/_components/icon-map'
import SettingsModal from './SettingsModal'

const cardStyle = {
  background: 'var(--c-card)',
  border: '1px solid var(--c-rim)',
  boxShadow: '0 1px 4px rgba(27,52,97,0.06)',
  textDecoration: 'none',
} as const

interface Props {
  sections: NavItem[]
}

export default function AdminGrid({ sections }: Props) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {sections.map(s => {
          const cardContent = (
            <>
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: s.color,
                  color: '#fff',
                  boxShadow: `0 4px 14px ${s.color}44`,
                }}
              >
                {ICON_MAP[s.icon]}
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
                  {s.label}
                </p>
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--c-ghost)' }}>
                  {s.desc}
                </p>
              </div>
            </>
          )

          if (s.href === '/admin/settings') {
            return (
              <button
                key={s.href}
                type="button"
                onClick={() => setShowSettings(true)}
                className="group flex flex-col items-center gap-3 rounded-2xl p-5 transition-all"
                style={{ ...cardStyle, cursor: 'pointer' }}
              >
                {cardContent}
              </button>
            )
          }

          return (
            <Link
              key={s.href}
              href={s.href}
              className="group flex flex-col items-center gap-3 rounded-2xl p-5 transition-all"
              style={cardStyle}
            >
              {cardContent}
            </Link>
          )
        })}
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  )
}
