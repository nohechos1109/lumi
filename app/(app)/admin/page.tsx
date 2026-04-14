import { adminNav } from '../_components/nav-config'
import AdminGrid from './_components/AdminGrid'

const sections = adminNav.filter(item => !item.exact)

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

      <AdminGrid sections={sections} />
    </div>
  )
}
