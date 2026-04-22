import Link from 'next/link'

export interface Crumb {
  label: string
  href?: string
}

export default function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs mb-5" aria-label="breadcrumb">
      {crumbs.map((c, i) => {
        const isLast = i === crumbs.length - 1
        return (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && (
              <span style={{ color: 'var(--c-rim-hi)' }}>/</span>
            )}
            {c.href && !isLast ? (
              <Link
                href={c.href}
                className="transition-opacity hover:opacity-70"
                style={{ color: 'var(--c-ghost)' }}
              >
                {c.label}
              </Link>
            ) : (
              <span style={{ color: isLast ? 'var(--c-dim)' : 'var(--c-ghost)' }}>
                {c.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
