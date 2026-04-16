import type { NavItem } from './nav-types'

export const salesNav: NavItem[] = [
  { href: '/dashboard',  label: 'Inicio',           icon: 'dashboard', color: '#2563EB', exact: true },
  { href: '/projects',   label: 'Proyectos',        icon: 'projects',  color: '#0284C7', desc: 'Mis proyectos activos' },
  { href: '/quotes',     label: 'Mis Cotizaciones', icon: 'quotes',    color: '#059669', desc: 'Cotizaciones que he generado' },
  { href: '/cobranza',   label: 'Cobranza',         icon: 'cobranza',  color: '#0891B2', desc: 'Ventas y cobros' },
  { href: '/pagos',      label: 'Pagos',            icon: 'pagos',     color: '#0369A1', desc: 'Historial de pagos' },
  { href: '/catalog',    label: 'Catálogo',         icon: 'catalog',   color: '#6366F1', desc: 'Productos disponibles' },
  { href: '/customers',  label: 'Clientes',         icon: 'customers', color: '#DC2626', desc: 'Directorio de clientes' },
  { href: '/plantillas', label: 'Plantillas',       icon: 'templates', color: '#8B5CF6', desc: 'Plantillas de cotización' },
]

export const restrictedNav: NavItem[] = [
  { href: '/dashboard', label: 'Inicio',        icon: 'dashboard', color: '#2563EB', exact: true },
  { href: '/quotes',    label: 'Cotizaciones',   icon: 'quotes',    color: '#059669', desc: 'Cotizaciones del sistema' },
  { href: '/servicios', label: 'Servicios',      icon: 'servicios', color: '#7C3AED', desc: 'Proyectos, órdenes y servicios en campo' },
  { href: '/catalog',   label: 'Catálogo',       icon: 'catalog',   color: '#6366F1', desc: 'Productos disponibles' },
]

export const tecnicoNav: NavItem[] = [
  { href: '/dashboard', label: 'Inicio',        icon: 'dashboard', color: '#2563EB', exact: true },
  { href: '/servicios', label: 'Mis Servicios', icon: 'servicios', color: '#7C3AED', desc: 'Servicios asignados' },
]

export const managerNav: NavItem[] = [
  { href: '/dashboard',       label: 'Inicio',       icon: 'dashboard', color: '#2563EB', exact: true },
  { href: '/projects',        label: 'Proyectos',    icon: 'projects',  color: '#0284C7', desc: 'Todos los proyectos' },
  { href: '/quotes',          label: 'Cotizaciones', icon: 'quotes',    color: '#059669', desc: 'Cotizaciones del equipo' },
  { href: '/customers',       label: 'Clientes',     icon: 'customers', color: '#DC2626', desc: 'Directorio de clientes' },
  { href: '/plantillas',      label: 'Plantillas',   icon: 'templates', color: '#8B5CF6', desc: 'Plantillas de cotización' },
  { href: '/catalog',         label: 'Catálogo',     icon: 'catalog',   color: '#6366F1', desc: 'Vista de catálogo para el público' },
  { href: '/admin/unidades',  label: 'Unidades',     icon: 'unidades',  color: '#0891B2', desc: 'Flota de unidades, rutas y grupos' },
  { href: '/servicios',       label: 'Servicios',    icon: 'servicios', color: '#7C3AED', desc: 'Proyectos, órdenes y servicios en campo' },
  { href: '/convenios',       label: 'Convenios',    icon: 'convenios', color: '#7C3AED', desc: 'Calendario de pagos acordados' },
]

export const adminNav: NavItem[] = [
  { href: '/admin',                    label: 'Inicio',        icon: 'dashboard', color: '#2563EB', exact: true },
  { href: '/projects',                 label: 'Proyectos',     icon: 'projects',  color: '#0284C7', desc: 'Gestión de proyectos' },
  { href: '/quotes',                   label: 'Cotizaciones',  icon: 'quotes',    color: '#059669', desc: 'Todas las cotizaciones del equipo' },
  { href: '/cobranza',                 label: 'Cobranza',      icon: 'cobranza',  color: '#0891B2', desc: 'Ventas y cobros' },
  { href: '/pagos',                    label: 'Pagos',         icon: 'pagos',     color: '#0369A1', desc: 'Historial de pagos' },
  { href: '/convenios',                label: 'Convenios',     icon: 'convenios', color: '#7C3AED', desc: 'Calendario de pagos acordados' },
  { href: '/admin/users',              label: 'Usuarios',      icon: 'users',     color: '#475569', desc: 'Cuentas y roles de acceso' },
  { href: '/admin/products',           label: 'Productos',     icon: 'products',  color: '#16A34A', desc: 'Catálogo, precios y costos' },
  { href: '/admin/discount-approvals', label: 'Descuentos',    icon: 'discounts', color: '#EA580C', desc: 'Aprobación de descuentos' },
  { href: '/admin/plantillas',         label: 'Plantillas',    icon: 'templates', color: '#8B5CF6', desc: 'Gestión de plantillas' },
  { href: '/admin/customers',          label: 'Clientes',      icon: 'customers', color: '#DC2626', desc: 'Base de datos de clientes' },
  { href: '/catalog',                  label: 'Catálogo',      icon: 'catalog',   color: '#6366F1', desc: 'Vista de catálogo para el público' },
  { href: '/admin/settings',           label: 'Configuración', icon: 'settings',  color: '#64748B', desc: 'Tipo de cambio e impuestos' },
  { href: '/admin/unidades',           label: 'Unidades',      icon: 'unidades',  color: '#0891B2', desc: 'Flota de unidades, rutas y grupos' },
  { href: '/servicios',                label: 'Servicios',     icon: 'servicios', color: '#7C3AED', desc: 'Proyectos, órdenes y servicios en campo' },
]

export const NAV_BY_ROLE: Record<string, NavItem[]> = {
  sales:   salesNav,
  almacen: restrictedNav,
  soporte: restrictedNav,
  manager: managerNav,
  admin:   adminNav,
  tecnico: tecnicoNav,
}
