import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { sessionOptions, SessionData } from '@/lib/session'
import { NAV_BY_ROLE } from '../_components/nav-config'
import { ICON_MAP } from '../_components/icon-map'

const roleLabel: Record<string, string> = {
  sales:   'Ventas',
  manager: 'Gerente',
}

export default async function DashboardPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (session.role === 'admin') redirect('/admin')

  const allItems = NAV_BY_ROLE[session.role as keyof typeof NAV_BY_ROLE] ?? []
  const sections = allItems.filter(item => !item.exact)

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--c-ghost)' }}>
          {roleLabel[session.role] ?? session.role}
        </p>
        <h1
          className="font-heading text-3xl font-bold"
          style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
        >
          Hola, {session.username}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          ¿A dónde vas hoy?
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {sections.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="flex flex-col items-center gap-3 rounded-2xl p-5 transition-all"
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
