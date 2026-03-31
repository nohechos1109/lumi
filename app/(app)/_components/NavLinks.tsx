'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem { href: string; label: string }

export default function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
      {items.map(item => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex items-center px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{
              color: active ? 'var(--c-navy)' : 'var(--c-dim)',
              background: active ? 'var(--c-navy-bg)' : 'transparent',
              fontWeight: active ? 600 : 400,
            }}
          >
            {active && (
              <span
                style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: '3px',
                  background: 'var(--c-navy)',
                  borderRadius: '0 3px 3px 0',
                }}
              />
            )}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
