import Link from 'next/link'
import {
  IconProjects, IconQuotes, IconUsers,
  IconProducts, IconDiscounts, IconTemplates, IconCustomers, IconSettings, IconCatalog,
} from '../_components/NavIcons'

const sections = [
  { href: '/projects',                 label: 'Proyectos',     desc: 'Gestión de proyectos',              icon: <IconProjects />,  color: '#1C5AD6' },
  { href: '/quotes',                   label: 'Cotizaciones',  desc: 'Todas las cotizaciones del equipo', icon: <IconQuotes />,    color: '#0B9962' },
  { href: '/admin/users',              label: 'Usuarios',      desc: 'Cuentas y roles de acceso',         icon: <IconUsers />,     color: '#1B3461' },
  { href: '/admin/products',           label: 'Productos',     desc: 'Catálogo, precios y costos',        icon: <IconProducts />,  color: '#0B9962' },
  { href: '/admin/discount-approvals', label: 'Descuentos',    desc: 'Aprobación de descuentos',          icon: <IconDiscounts />, color: '#C47F08' },
  { href: '/admin/plantillas',         label: 'Plantillas',    desc: 'Gestión de plantillas',             icon: <IconTemplates />, color: '#7C3AED' },
  { href: '/admin/customers',          label: 'Clientes',      desc: 'Base de datos de clientes',         icon: <IconCustomers />, color: '#D12C3C' },
  { href: '/catalog',                  label: 'Catálogo',      desc: 'Vista de catálogo para el público', icon: <IconCatalog />,   color: '#C47F08' },
  { href: '/admin/settings',           label: 'Configuración', desc: 'Tipo de cambio e impuestos',        icon: <IconSettings />,  color: '#445566' },
]

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
              {s.icon}
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
