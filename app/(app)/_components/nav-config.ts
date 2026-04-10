import type { NavItem } from './nav-types'

export const salesNav: NavItem[] = [
  { href: '/dashboard',  label: 'Inicio',           icon: 'dashboard', color: '#1B3461', exact: true },
  { href: '/projects',   label: 'Proyectos',        icon: 'projects',  color: '#1C5AD6', desc: 'Mis proyectos activos' },
  { href: '/quotes',     label: 'Mis Cotizaciones', icon: 'quotes',    color: '#0B9962', desc: 'Cotizaciones que he generado' },
  { href: '/ventas',     label: 'Cobranza',         icon: 'cobranza',  color: '#059669', desc: 'Ventas y cobros' },
  { href: '/catalog',    label: 'Catálogo',         icon: 'catalog',   color: '#C47F08', desc: 'Productos disponibles' },
  { href: '/customers',  label: 'Clientes',         icon: 'customers', color: '#D12C3C', desc: 'Directorio de clientes' },
  { href: '/plantillas', label: 'Plantillas',       icon: 'templates', color: '#7C3AED', desc: 'Plantillas de cotización' },
]

export const restrictedNav: NavItem[] = [
  { href: '/dashboard', label: 'Inicio',        icon: 'dashboard', color: '#1B3461', exact: true },
  { href: '/quotes',    label: 'Cotizaciones',   icon: 'quotes',    color: '#0B9962', desc: 'Cotizaciones del sistema' },
  { href: '/catalog',   label: 'Catálogo',       icon: 'catalog',   color: '#C47F08', desc: 'Productos disponibles' },
]

export const managerNav: NavItem[] = [
  { href: '/dashboard',  label: 'Inicio',       icon: 'dashboard', color: '#1B3461', exact: true },
  { href: '/projects',   label: 'Proyectos',    icon: 'projects',  color: '#1C5AD6', desc: 'Todos los proyectos' },
  { href: '/quotes',     label: 'Cotizaciones', icon: 'quotes',    color: '#0B9962', desc: 'Cotizaciones del equipo' },
  { href: '/ventas',     label: 'Cobranza',     icon: 'cobranza',  color: '#059669', desc: 'Ventas y cobros' },
  { href: '/customers',  label: 'Clientes',     icon: 'customers', color: '#D12C3C', desc: 'Directorio de clientes' },
  { href: '/plantillas', label: 'Plantillas',   icon: 'templates', color: '#7C3AED', desc: 'Plantillas de cotización' },
  { href: '/catalog',    label: 'Catálogo',     icon: 'catalog',   color: '#C47F08', desc: 'Productos disponibles' },
]

export const adminNav: NavItem[] = [
  { href: '/admin',                    label: 'Inicio',        icon: 'dashboard', color: '#1B3461', exact: true },
  { href: '/projects',                 label: 'Proyectos',     icon: 'projects',  color: '#1C5AD6', desc: 'Gestión de proyectos' },
  { href: '/quotes',                   label: 'Cotizaciones',  icon: 'quotes',    color: '#0B9962', desc: 'Todas las cotizaciones del equipo' },
  { href: '/ventas',                   label: 'Cobranza',      icon: 'cobranza',  color: '#059669', desc: 'Ventas y cobros' },
  { href: '/admin/users',              label: 'Usuarios',      icon: 'users',     color: '#1B3461', desc: 'Cuentas y roles de acceso' },
  { href: '/admin/products',           label: 'Productos',     icon: 'products',  color: '#0B9962', desc: 'Catálogo, precios y costos' },
  { href: '/admin/discount-approvals', label: 'Descuentos',    icon: 'discounts', color: '#C47F08', desc: 'Aprobación de descuentos' },
  { href: '/admin/plantillas',         label: 'Plantillas',    icon: 'templates', color: '#7C3AED', desc: 'Gestión de plantillas' },
  { href: '/admin/customers',          label: 'Clientes',      icon: 'customers', color: '#D12C3C', desc: 'Base de datos de clientes' },
  { href: '/catalog',                  label: 'Catálogo',      icon: 'catalog',   color: '#C47F08', desc: 'Vista de catálogo para el público' },
  { href: '/admin/settings',           label: 'Configuración', icon: 'settings',  color: '#445566', desc: 'Tipo de cambio e impuestos' },
]

export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  sales:   salesNav,
  almacen: restrictedNav,
  soporte: restrictedNav,
  manager: managerNav,
  admin:   adminNav,
}
