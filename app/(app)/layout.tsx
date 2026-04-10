import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import TopBar from './_components/TopBar'
import Toaster from '@/components/ui/Toaster'
import { NAV_BY_ROLE } from './_components/nav-config'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  const items = NAV_BY_ROLE[session.role as keyof typeof NAV_BY_ROLE] ?? []

  const roleLabel: Record<string, string> = {
    sales:   'Ventas',
    manager: 'Gerente',
    admin:   'Administrador',
    almacen: 'Almacén',
    soporte: 'Soporte',
  }

  const homeHref = session.role === 'admin' ? '/admin' : '/dashboard'

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-base)' }}>
      <TopBar
        items={items}
        username={session.username ?? ''}
        roleLabel={roleLabel[session.role] ?? session.role}
        userInitial={(session.username?.charAt(0) ?? '?').toUpperCase()}
        homeHref={homeHref}
      />

      <Toaster />

      <main className="pt-14 overflow-auto min-w-0">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
