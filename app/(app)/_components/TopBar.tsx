import Image from 'next/image'
import Link from 'next/link'
import type { NavItem } from './nav-types'
import AppLauncherButton from './AppLauncherButton'
import LogoutButton from './LogoutButton'
import NotificationBell from '@/components/ui/NotificationBell'

interface Props {
  items: NavItem[]
  username: string
  roleLabel: string
  userInitial: string
}

export default function TopBar({ items, username, roleLabel, userInitial }: Props) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3"
      style={{
        background: 'var(--c-panel)',
        borderBottom: '1px solid var(--c-rim)',
        boxShadow: '0 1px 8px rgba(27,52,97,0.06)',
      }}
    >
      {/* Logo — links to role home */}
      <Link href="/" className="flex items-center shrink-0">
        <Image src="/lumi-logo.svg" alt="LUMI" width={88} height={28} className="object-contain" priority />
      </Link>

      {/* Waffle launcher button */}
      <AppLauncherButton items={items} />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notifications */}
      <NotificationBell />

      {/* User chip */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
        style={{ background: 'var(--c-base)' }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-bold text-xs"
          style={{
            background: 'var(--c-navy-bg)',
            color: 'var(--c-navy)',
            border: '1.5px solid var(--c-navy-bd)',
          }}
        >
          {userInitial}
        </div>
        <div className="leading-tight">
          <p className="text-xs font-semibold" style={{ color: 'var(--c-ink)' }}>{username}</p>
          <p className="text-[10px]" style={{ color: 'var(--c-ghost)' }}>{roleLabel}</p>
        </div>
      </div>

      {/* Logout */}
      <LogoutButton />
    </header>
  )
}
