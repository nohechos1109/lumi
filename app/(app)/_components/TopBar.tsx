import Image from 'next/image'
import Link from 'next/link'
import type { NavItem } from './nav-types'
import AppLauncherButton from './AppLauncherButton'
import UserMenu from './UserMenu'
import NotificationBell from '@/components/ui/NotificationBell'

interface Props {
  items: NavItem[]
  username: string
  roleLabel: string
  userInitial: string
  homeHref: string
  appSection?: 'quotes' | 'collection'
}

export default function TopBar({ items, username, roleLabel, userInitial, homeHref, appSection = 'quotes' }: Props) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 gap-3"
      style={{
        background: 'var(--c-panel)',
        borderBottom: '1px solid var(--c-rim)',
        boxShadow: '0 1px 8px rgba(27,52,97,0.06)',
      }}
    >
      {/* Logo — links to role home, changes based on app section */}
      <Link href={homeHref} className="flex items-center shrink-0">
        <Image
          src={appSection === 'collection' ? '/lumi-logo-collection.svg' : '/lumi-logo.svg'}
          alt={appSection === 'collection' ? 'LUMI COLLECTION' : 'LUMI QUOTES'}
          width={150}
          height={46}
          className="object-contain"
          priority
        />
      </Link>

      {/* User menu (chip + dropdown with logout) */}
      <UserMenu username={username} roleLabel={roleLabel} userInitial={userInitial} />

      {/* Notifications */}
      <NotificationBell />

      {/* Waffle launcher button */}
      <AppLauncherButton items={items} />
    </header>
  )
}
