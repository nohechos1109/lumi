import { adminNav } from '../_components/nav-config'
import AdminGrid from './_components/AdminGrid'

const sections = adminNav.filter(item => !item.exact)

export default function AdminPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-10">
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-2"
          style={{ color: 'var(--c-ghost)', letterSpacing: '0.1em' }}
        >
          Administrador
        </p>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--c-ink)', fontFamily: 'var(--font-montserrat)' }}
        >
          Inicio
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--c-ghost)' }}>
          Administración del sistema
        </p>
      </div>

      <AdminGrid sections={sections} />
    </div>
  )
}
