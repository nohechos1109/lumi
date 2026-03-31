'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface NavItem { href: string; label: string }

interface Props {
  items: NavItem[]
  username: string
  roleLabel: string
}

export default function MobileNavbar({ items, username, roleLabel }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <>
      {/* Top bar — mobile only */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center px-4 h-14"
        style={{
          background: 'var(--c-panel)',
          borderBottom: '1px solid var(--c-rim)',
          boxShadow: '0 1px 4px rgba(27,52,97,0.06)',
        }}
      >
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg mr-3 transition-colors"
          style={{ color: 'var(--c-dim)' }}
          aria-label="Abrir menú"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="3" y1="5" x2="17" y2="5"/>
            <line x1="3" y1="10" x2="17" y2="10"/>
            <line x1="3" y1="15" x2="17" y2="15"/>
          </svg>
        </button>
        <Image src="/lumi-logo.svg" alt="LUMI" width={110} height={32} className="object-contain" />
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50"
          style={{ background: 'rgba(9,11,16,0.45)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 flex flex-col transition-transform duration-200 ease-in-out ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--c-panel)', borderRight: '1px solid var(--c-rim)' }}
      >
        {/* Drawer header */}
        <div
          className="px-5 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--c-rim)' }}
        >
          <div className="flex flex-col gap-2">
            <Image src="/lumi-logo.svg" alt="LUMI" width={120} height={34} className="object-contain" />
            <div className="flex items-center gap-1.5 opacity-50">
              <span className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: 'var(--c-dim)' }}>Partner</span>
              <Image unoptimized src="/logosmart.png" alt="Smart Systems" width={45} height={14} className="object-contain grayscale opacity-80" />
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-base leading-none"
            style={{ color: 'var(--c-ghost)' }}
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-3" style={{ borderBottom: '1px solid var(--c-rim)' }}>
          <div
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
            style={{ background: 'var(--c-base)' }}
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
              style={{
                background: 'var(--c-navy-bg)',
                color: 'var(--c-navy)',
                border: '1.5px solid var(--c-navy-bd)',
              }}
            >
              {username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>{username}</p>
              <p className="text-xs" style={{ color: 'var(--c-ghost)' }}>{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
          {items.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
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

        {/* Logout */}
        <div className="p-3" style={{ borderTop: '1px solid var(--c-rim)' }}>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{ color: 'var(--c-ghost)', background: 'transparent' }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  )
}
