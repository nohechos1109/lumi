'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { NavItem } from '@/app/(app)/_components/nav-types'
import { ICON_MAP } from '@/app/(app)/_components/icon-map'
import SettingsModal from './SettingsModal'

const cardStyle = {
  background: 'var(--c-card)',
  border: '1px solid var(--c-rim)',
  boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
  textDecoration: 'none',
} as const

interface Props {
  sections: NavItem[]
}

export default function AdminGrid({ sections }: Props) {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sections.map(s => {
          const cardContent = (
            <>
              {/* Icon — tinted background, colored stroke */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${s.color}14`,
                  color: s.color,
                }}
              >
                {ICON_MAP[s.icon]}
              </div>

              {/* Text */}
              <div>
                <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}>
                  {s.label}
                </p>
                {s.desc && (
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--c-ghost)' }}>
                    {s.desc}
                  </p>
                )}
              </div>
            </>
          )

          if (s.href === '/admin/settings') {
            return (
              <button
                key={s.href}
                type="button"
                onClick={() => setShowSettings(true)}
                className="card-link flex flex-col items-start gap-4 rounded-xl p-4 transition-all w-full text-left"
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
              className="card-link flex flex-col items-start gap-4 rounded-xl p-4"
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
