import Link from 'next/link'

const sections = [
  { href: '/admin/users',     label: 'Usuarios',       desc: 'Gestionar cuentas y roles de acceso' },
  { href: '/admin/products',  label: 'Productos',       desc: 'Catálogo, precios y costos unitarios' },
  { href: '/admin/customers', label: 'Clientes',        desc: 'Base de datos de clientes' },
  { href: '/admin/settings',  label: 'Configuración',   desc: 'Tipo de cambio, impuestos y condiciones' },
]

export default function AdminPage() {
  return (
    <div>
      <div className="mb-8">
        <h1
          className="font-heading text-3xl font-bold"
          style={{ color: 'var(--c-ink)', letterSpacing: '0.04em' }}
        >
          Panel Admin
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          Administración del sistema
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sections.map(s => (
          <Link
            key={s.href}
            href={s.href}
            className="card-link rounded-xl p-6"
            style={{
              background: 'var(--c-card)',
              border: '1px solid var(--c-rim)',
              boxShadow: '0 1px 3px rgba(27,52,97,0.05)',
              display: 'block',
            }}
          >
            <p className="font-heading text-xl font-bold" style={{ color: 'var(--c-navy)', letterSpacing: '0.04em' }}>
              {s.label}
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--c-dim)' }}>{s.desc}</p>
            <p className="text-xs mt-4 font-medium" style={{ color: 'var(--c-navy)' }}>
              Abrir →
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
