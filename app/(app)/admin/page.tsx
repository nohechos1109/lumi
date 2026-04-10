import Link from 'next/link'
import { adminNav } from '../_components/nav-config'
import { ICON_MAP } from '../_components/icon-map'

const sections = adminNav.filter(item => !item.exact)

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h1
          className="font-heading text-3xl font-bold"
          style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
        >
          Inicio
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          Administración del sistema
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {sections.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col items-center gap-3 rounded-2xl p-5 transition-all"
            style={{
              background: 'var(--c-card)',
              border: '1px solid var(--c-rim)',
              boxShadow: '0 1px 4px rgba(27,52,97,0.06)',
              textDecoration: 'none',
            }}
          >
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
          </Link>
        ))}
      </div>
    </div>
  )
}
