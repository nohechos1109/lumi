import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import Image from 'next/image'
import NavLinks from './_components/NavLinks'
import LogoutButton from './_components/LogoutButton'
import MobileNavbar from './_components/MobileNavbar'
import Toaster from '@/components/ui/Toaster'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  const navItems = {
    sales: [
      { href: '/projects', label: 'Proyectos' },
      { href: '/quotes',   label: 'Mis Cotizaciones' },
    ],
    manager: [
      { href: '/projects', label: 'Proyectos' },
      { href: '/quotes',   label: 'Cotizaciones' },
      { href: '/manager',  label: 'Equipo' },
    ],
    admin: [
      { href: '/admin',          label: 'Dashboard' },
      { href: '/projects',       label: 'Proyectos' },
      { href: '/admin/users',    label: 'Usuarios' },
      { href: '/admin/products', label: 'Productos' },
      { href: '/admin/customers',label: 'Clientes' },
      { href: '/admin/settings', label: 'Configuración' },
    ],
  }

  const items = navItems[session.role as keyof typeof navItems] ?? []

  const roleLabel: Record<string, string> = {
    sales:   'Ventas',
    manager: 'Gerente',
    admin:   'Administrador',
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--c-base)' }}>
      {/* ── Mobile top bar + drawer ────────────────────────────── */}
      <MobileNavbar
        items={items}
        username={session.username ?? ''}
        roleLabel={roleLabel[session.role] ?? session.role}
      />

      {/* ── Sidebar (desktop only) ─────────────────────────────── */}
      <aside
        className="hidden md:flex w-60 flex-col shrink-0 sticky top-0 h-screen"
        style={{
          background: 'var(--c-panel)',
          borderRight: '1px solid var(--c-rim)',
          boxShadow: '1px 0 8px rgba(27,52,97,0.05)',
        }}
      >
        {/* Brand */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--c-rim)' }}>
          <div className="flex flex-col gap-3 mb-4 px-1">
            <Image
              src="/lumi-logo.svg"
              alt="LUMI"
              width={140}
              height={40}
              className="object-contain"
              priority
            />
            <div className="flex items-center gap-2 opacity-50">
              <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--c-dim)' }}>Partner</span>
              <Image unoptimized src="/logosmart.png" alt="Smart Systems" width={60} height={18} className="object-contain grayscale opacity-80" />
            </div>
          </div>

          {/* User info */}
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
            style={{ background: 'var(--c-base)' }}
          >
            {/* Avatar */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
              style={{
                background: 'var(--c-navy-bg)',
                color: 'var(--c-navy)',
                border: '1.5px solid var(--c-navy-bd)',
              }}
            >
              {session.username?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--c-ink)' }}>
                {session.username}
              </p>
              <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>
                {roleLabel[session.role] ?? session.role}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <NavLinks items={items} />

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid var(--c-rim)' }}>
          <LogoutButton />
        </div>
      </aside>

      <Toaster />

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="flex-1 overflow-auto min-w-0 pt-14 md:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
