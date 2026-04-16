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
  almacen: 'Almacén',
  soporte: 'Soporte',
  tecnico: 'Técnico',
}

export default async function DashboardPage() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (session.role === 'admin') redirect('/admin')

  const allItems = NAV_BY_ROLE[session.role as keyof typeof NAV_BY_ROLE] ?? []
  const sections = allItems.filter(item => !item.exact)

  return (
    <div className="animate-fade-in">
      {/* Greeting */}
      <div className="mb-10">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}
        >
          {roleLabel[session.role] ?? session.role}
        </p>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}
        >
          Hola, {session.username}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          ¿A dónde vas hoy?
        </p>
      </div>

      {/* Nav grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {sections.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="card-link flex flex-col items-start gap-4 rounded-xl p-4"
            style={{
              background: 'var(--c-card)',
              border: '1px solid var(--c-rim)',
              boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
              textDecoration: 'none',
            }}
          >
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
              <p
                className="text-sm font-semibold leading-tight"
                style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}
              >
                {s.label}
              </p>
              {s.desc && (
                <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--c-ghost)' }}>
                  {s.desc}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
