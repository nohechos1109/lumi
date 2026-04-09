import { cookies } from 'next/headers'
import { getIronSession } from 'iron-session'
import { sessionOptions, SessionData } from '@/lib/session'
import TopBar from './_components/TopBar'
import Toaster from '@/components/ui/Toaster'
import type { NavItem } from './_components/nav-types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  const salesNav: NavItem[] = [
    { href: '/dashboard',  label: 'Inicio',           icon: 'dashboard', color: '#1B3461', exact: true },
    { href: '/projects',   label: 'Proyectos',        icon: 'projects',  color: '#1C5AD6' },
    { href: '/quotes',     label: 'Mis Cotizaciones', icon: 'quotes',    color: '#0B9962' },
    { href: '/catalog',    label: 'Catálogo',         icon: 'catalog',   color: '#C47F08' },
    { href: '/customers',  label: 'Clientes',         icon: 'customers', color: '#D12C3C' },
    { href: '/plantillas', label: 'Plantillas',       icon: 'templates', color: '#7C3AED' },
  ]

  const navItems: Record<string, NavItem[]> = {
    sales:   salesNav,
    almacen: salesNav,
    soporte: salesNav,
    manager: [
      { href: '/dashboard',  label: 'Inicio',       icon: 'dashboard', color: '#1B3461', exact: true },
      { href: '/projects',   label: 'Proyectos',    icon: 'projects',  color: '#1C5AD6' },
      { href: '/quotes',     label: 'Cotizaciones', icon: 'quotes',    color: '#0B9962' },
      { href: '/customers',  label: 'Clientes',     icon: 'customers', color: '#D12C3C' },
      { href: '/plantillas', label: 'Plantillas',   icon: 'templates', color: '#7C3AED' },
      { href: '/catalog',    label: 'Catálogo',     icon: 'catalog',   color: '#C47F08' },
      { href: '/manager',    label: 'Equipo',       icon: 'team',      color: '#0891B2' },
    ],
    admin: [
      { href: '/admin',                    label: 'Inicio',       icon: 'dashboard', color: '#1B3461', exact: true },
      { href: '/projects',                 label: 'Proyectos',    icon: 'projects',  color: '#1C5AD6' },
      { href: '/quotes',                   label: 'Cotizaciones', icon: 'quotes',    color: '#0B9962' },
      { href: '/manager',                  label: 'Equipo',       icon: 'team',      color: '#0891B2' },
      { href: '/admin/users',              label: 'Usuarios',     icon: 'users',     color: '#1B3461' },
      { href: '/admin/products',           label: 'Productos',    icon: 'products',  color: '#0B9962' },
      { href: '/admin/discount-approvals', label: 'Descuentos',   icon: 'discounts', color: '#C47F08' },
      { href: '/admin/plantillas',         label: 'Plantillas',   icon: 'templates', color: '#7C3AED' },
      { href: '/admin/customers',          label: 'Clientes',     icon: 'customers', color: '#D12C3C' },
      { href: '/catalog',                  label: 'Catálogo',     icon: 'catalog',   color: '#C47F08' },
      { href: '/admin/settings',           label: 'Configuración',icon: 'settings',  color: '#445566' },
    ],
  }

  const items = navItems[session.role as keyof typeof navItems] ?? []

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
